sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/BusyIndicator"
],
function (BaseController, MessageBox, MessageToast, JSONModel, BusyIndicator) {
    "use strict";

    return BaseController.extend("com.seidor.zuxmmz42xml.controller.Worklist", {
         /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */
        onInit: function () {
            var oViewModel;

            oViewModel = new JSONModel({
                userId : ''
            });

            this.getRouter().getRoute("worklist").attachPatternMatched(this._onMasterMatched, this);
            this.setModel(oViewModel, "worklistView");            
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */ 
        onHandleAddAttachment: function(oEvent){
            if (!this._oDialogAddAttachment) {
                this._oDialogAddAttachment = sap.ui.xmlfragment(this.getView().getId(),"com.seidor.zuxmmz42xml.view.fragments.DialogFileUpload", this);
            }
    
            this.getView().addDependent(this._oDialogAddAttachment);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialogAddAttachment);

             this._oDialogAddAttachment.open();
        },

        onHandleCancelUpload: function(oEvent){
            this._oDialogAddAttachment.destroy();
            this._oDialogAddAttachment = null;
        },

        onHandleConfirmUpload: function(oEvent){
            var oFileUploader = this.getView().byId("fileUploader");
            this.csrfToken = this.getView().getModel().getSecurityToken();
            oFileUploader.setSendXHR(true);
            var headerParma = new sap.ui.unified.FileUploaderParameter();
            headerParma.setName('x-csrf-token');
            headerParma.setValue(this.csrfToken);
            oFileUploader.addHeaderParameter(headerParma);
            var headerParma2 = new sap.ui.unified.FileUploaderParameter();
            headerParma2.setName('slug');
            headerParma2.setValue(oFileUploader.getValue());
            oFileUploader.addHeaderParameter(headerParma2);
            oFileUploader.checkFileReadable().then(function() {
                oFileUploader.upload();
                oFileUploader.destroyHeaderParameters();
            }.bind(this), function(error) {
                MessageBox.error( this.getResourceBundle().getText("message_error_upload_attachment"), { styleClass: this.getOwnerComponent().getContentDensityClass() }, this);
            }).then(function() {
                oFileUploader.clear();
            }.bind(this));
        },

        onHandleEntrada: function(oEvent){
            var oTable = this.byId("ID_TABLE_NF").getTable(),
                sSelectedIndice = oTable.getSelectedIndices();
            
            if(!sSelectedIndice.length){
                MessageBox.error( this.getResourceBundle().getText("message_error_selected_line"), { styleClass: this.getOwnerComponent().getContentDensityClass() }, this);
                return;
            }
            
            var sObject = this.byId("ID_TABLE_NF")._getRowBinding().getContexts()[sSelectedIndice[0]].getObject();  

            this.getRouter().navTo("detail", {
                lifnr: sObject.lifnr,
                acckey: sObject.acckey
            }, true);            
            
        },

        onHandleDelete: function(oEvent){
            var oTable = this.byId("ID_TABLE_NF").getTable(),
                sSelectedIndice = oTable.getSelectedIndices();
            
            if(!sSelectedIndice.length){
                MessageBox.error( this.getResourceBundle().getText("message_error_selected_line"), { styleClass: this.getOwnerComponent().getContentDensityClass() }, this);
                return;
            }

            var sObject = this.byId("ID_TABLE_NF")._getRowBinding().getContexts()[sSelectedIndice[0]].getObject();  
            if(!!sObject.DocMaterial){
                MessageBox.error( this.getResourceBundle().getText("message_error_generated_docMaterial"), { styleClass: this.getOwnerComponent().getContentDensityClass() }, this);
                return;   
            }

            MessageBox.confirm(this.getResourceBundle().getText("message_question_confirm_remove_register"), {
				title: this.getResourceBundle().getText("form_label_5"),
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
				onClose: function (sAction) {
					if(sAction == MessageBox.Action.YES)
                        this._deleteRegister(sObject);
				}.bind(this),
				dependentOn: this.getView()
			});            

        },

        onHanleUploadComplete: function(oEvent){
            var oTable = this.byId("ID_TABLE_NF").getTable(),
                sResponse = oEvent.getParameter("responseRaw"),
                iHttpStatusCode = oEvent.getParameter("status"),
                sMessage;

            if(iHttpStatusCode === 200 || iHttpStatusCode === 201){
                sap.m.MessageToast.show(this.getResourceBundle().getText("message_success_upload_attachment"));
                oTable.getModel().refresh(true); 
                this.onHandleCancelUpload();
            }else{
                try{
                    var parser = new DOMParser(),
                        xmlDoc = parser.parseFromString(sResponse,"text/xml"),
                        sMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

                    MessageBox.error(sMessage, 
                              { styleClass: this.getOwnerComponent().getContentDensityClass() } );
                }catch(err){};
            }        

        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _onMasterMatched:  function(oEvent) {
            var oTable = this.getView().byId("ID_TABLE_NF").getTable();
			oTable.setSelectionMode("Single");
       },

       _deleteRegister: function(oEntry){
            var oTable = this.byId("ID_TABLE_NF").getTable(),
                oDataModel = this.getModel(),
                sPath = this.getModel().createKey("HeaderSet", { Lifnr  : oEntry.lifnr,
                                                                 Acckey : oEntry.acckey });
            BusyIndicator.show();

            oDataModel.remove("/" + sPath, {
                success: function (oData, oResponse) {
                    BusyIndicator.hide();
                    MessageBox.success(this.getResourceBundle().getText("message_success_delete_register"), 
                        { styleClass: this.getOwnerComponent().getContentDensityClass() } ); 
                    oTable.getModel().refresh(true);                           
                }.bind(this),
                error: function(oError){ 
                    BusyIndicator.hide();
                    try{
                        var sMsg = JSON.parse(oError.responseText);
                        MessageBox.error(sMsg.error.message.value, 
                                  { styleClass: this.getOwnerComponent().getContentDensityClass() }
                         );
                    }catch(err){};
                }.bind(this)
            });
                
       }
           
    });
});
