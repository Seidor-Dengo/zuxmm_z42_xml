/*global QUnit*/

sap.ui.define([
	"comseidor/zuxmm_z42_xml/controller/WorklistView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("WorklistView Controller");

	QUnit.test("I should test the WorklistView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
