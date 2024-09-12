/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comseidor/zuxmm_z42_xml/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
