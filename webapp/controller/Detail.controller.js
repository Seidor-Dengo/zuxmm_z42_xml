sap.ui.define([
    "./BaseController",
	"com/seidor/zuxmmz42xml/model/formatter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/Fragment"
],
function (BaseController, formatter, MessageBox, MessageToast, JSONModel, BusyIndicator, Fragment) {
    "use strict";

    return BaseController.extend("com.seidor.zuxmmz42xml.controller.Detail", {

		formatter: formatter,

         /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */
        onInit: function () {
            var oViewModel;

            oViewModel = new JSONModel({
				TotalQuantidade: 0,
				TotalValorUnitario: 0,
				TotalValorTotal: 0,
				enabledEdit: false,
                Products : []
            });

            this.getRouter().getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
            this.setModel(oViewModel, "detailView");    
			

			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);	
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */ 
        onHandleClose: function(oEvent){
			this.getRouter().navTo("worklist", null);
		},

		onHandleCalculateTotalItems: function(oEvent){
			var oViewModel = this.getModel("detailView"),
				sProducts = oViewModel.getProperty("/Products"),
				sTotalQuant = 0,
				sTotalValorUnit = 0,
				sTotalValorTotal = 0;

			sProducts.forEach(function(oItem){
				sTotalQuant += parseFloat(oItem.Menge ?? 0);
				sTotalValorUnit += parseFloat(oItem.ValorUnit ?? 0);
				sTotalValorTotal += parseFloat(oItem.ValorTotal ?? 0);
			}, this);

			oViewModel.setProperty("/TotalQuantidade", sTotalQuant);
			oViewModel.setProperty("/TotalValorUnitario", sTotalValorUnit);
			oViewModel.setProperty("/TotalValorTotal", sTotalValorTotal);
		},

		onHandleDeleteItem: function(oEvent){
            var oTable = this.byId("tableProdutosNF"),
                sSelectedIndice = oTable.getSelectedIndices();
            
            if(!sSelectedIndice.length){
                MessageBox.error( this.getResourceBundle().getText("message_error_selected_line"), { styleClass: this.getOwnerComponent().getContentDensityClass() }, this);
                return;
            }

            MessageBox.confirm(this.getResourceBundle().getText("message_question_confirm_remove_product"), {
				title: this.getResourceBundle().getText("form_label_5"),
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
				onClose: function (sAction) {
					if(sAction == MessageBox.Action.YES)
						//this._deleteDBProdutos();
						this._deleteViewProdutos();
				}.bind(this),
				dependentOn: this.getView()
			}); 
		},

		onHandleEntrada: function(oEvent){
			var oDataModel = this.getModel(),
				oViewModel = this.getModel("detailView"),
				oEntry = this.getView().getBindingContext().getObject(),
				oProducts = oViewModel.getProperty("/Products");

				delete oEntry.__metadata;
				delete oEntry.ItemSet;
				

				oProducts.forEach(function(oItem, oIndex){
					if(!!oItem.DataValidade){
						oProducts[oIndex].Data_Validade = oItem.DataValidade;
					}

					if(!!oItem.DataFabricacao){
						oProducts[oIndex].Data_Fabricacao = oItem.DataFabricacao;					
					}
				}, this);

				oEntry.ProductsJson = JSON.stringify(oProducts);

				BusyIndicator.show();
				this.oMessageManager.removeAllMessages();

				oDataModel.create("/HeaderSet", oEntry, {
					success: function (oData, oResponse) {
						BusyIndicator.hide();
						MessageBox.success(this.getResourceBundle().getText("message_success_created_moviment"));
						oViewModel.setProperty("/enabledEdit", false)
						this.getModel().refresh(true);                           
					}.bind(this),
					error: function(oError){ 
						BusyIndicator.hide();
						MessageBox.error(this.getResourceBundle().getText("message_error_created_moviment"), 
                                        { styleClass: this.getOwnerComponent().getContentDensityClass() });
					}.bind(this)
				});				
			
		},

		onMessagePopoverPress : function (oEvent) {
			var oSourceControl = oEvent.getSource();
			this._getMessagePopover().then(function(oMessagePopover){
				oMessagePopover.openBy(oSourceControl);
			});
		},		

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _onDetailMatched:  function(oEvent) {
			var sLifnr =  oEvent.getParameter("arguments").lifnr,
                sAcckey = oEvent.getParameter("arguments").acckey;

			this.getModel().metadataLoaded().then( function() {
				var sObjectPath = this.getModel().createKey("HeaderSet", {
					Lifnr  : sLifnr,
                    Acckey : sAcckey
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
        },
        
		_bindView : function (sObjectPath) {
			var oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				parameters: { expand: "ItemSet" },
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
					},
					dataReceived: function () {
					}
				}
			});
		},  
        
		_onBindingChange : function () {
			
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				oViewModel = this.getModel("detailView"),
				sProduct,
				aProducts = [];

			oViewModel.setProperty("/Products", []);	
			this.oMessageManager.removeAllMessages();

			if (!!oElementBinding.getBoundContext()) {
				var oObject = oView.getBindingContext().getObject();

				oObject.ItemSet.__list.forEach(function(oItem){
					sProduct = this.getModel().getProperty("/" + oItem);
					delete sProduct.__metadata;
					aProducts.push(sProduct);
				}, this);
				
				oViewModel.setProperty("/Products", aProducts);
				oViewModel.setProperty("/enabledEdit", !oObject.Mblnr);

				this.byId("tableProdutosNF").setVisibleRowCount(aProducts.length);
			}

		},
		
		_deleteDBProdutos: function(){
			
			var oDataModel = this.getModel(),
				oTable = this.byId("tableProdutosNF"),
				aDeferredGroup = []; 
			
            aDeferredGroup = oDataModel.getDeferredGroups();
			aDeferredGroup.push("batchCreate");
			oDataModel.setDeferredGroups(aDeferredGroup); 

			var oSelectedIndices = oTable.getSelectedIndices(),
				oContextTable = oTable._getRowContexts(),
				oEntryItem,
				sPath; 

			oSelectedIndices.forEach(function(oItem) {
                oEntryItem = oContextTable[oItem].getObject();
				sPath = this.getModel().createKey("ItemSet", { Lifnr  : oEntryItem.Lifnr,
															   Acckey : oEntryItem.Acckey,
															   Zeile  : oEntryItem.Zeile });
                oDataModel.remove("/" + sPath, {groupId:"batchCreate"});	
            }, this); 


            BusyIndicator.show();

            oDataModel.submitChanges({groupId:"batchCreate", 
                success: function(oData, response) {
                    BusyIndicator.hide();
					MessageToast.show(this.getResourceBundle().getText("message_success_delete_product"));
					this._deleteViewProdutos();
                }.bind(this),
                error: function(oError){ 
                    BusyIndicator.hide();
                    MessageBox.error(this.getResourceBundle().getText("message_error_delete_product"), 
                                        { styleClass: this.getOwnerComponent().getContentDensityClass() });

                }.bind(this)
            });            			
		},

		_deleteViewProdutos: function(){
			var oViewModel = this.getModel("detailView"),
				oTable = this.byId("tableProdutosNF"),
				oSelectedIndices = oTable.getSelectedIndices(),
				oContextTable = oTable._getRowContexts(),
				oEntryTable = oViewModel.getProperty("/Products"),
				oEntryItem;
				
				oSelectedIndices.forEach(function(oItem) {
					oEntryItem = oContextTable[oItem].getObject();
					oEntryTable = oEntryTable.filter(itm => { return itm.Zeile !== oEntryItem.Zeile });
				}, this); 
				
				oViewModel.setProperty("/Products", oEntryTable);
		},

		_getMessagePopover : function () {
			var oView = this.getView();

			// create popover lazily (singleton)
			if (!this._pMessagePopover) {
				this._pMessagePopover = Fragment.load({
					id: oView.getId(),
					name: "com.seidor.zuxmmz42xml.view.fragments.MessagePopover"
				}).then(function (oMessagePopover) {
					oView.addDependent(oMessagePopover);
					return oMessagePopover;
				});
			}
			return this._pMessagePopover;
		}		
           
    });
});
