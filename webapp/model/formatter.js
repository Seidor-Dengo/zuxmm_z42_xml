sap.ui.define([
    "sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
    "use strict";

    return {

        formatNumberBrazilDec2: function (pValue) {
            var oNumberFormat = NumberFormat.getFloatInstance({
                maxFractionDigits: 2,
                groupingEnabled: true,
                groupingSeparator: ".",
                decimalSeparator: ","
            });

            if (isNaN(pValue)) {
                pValue = 0;
            }

            var text = oNumberFormat.format(pValue);
            return text;

        },

        formatNumberBrazilDec4: function (pValue) {
            var oNumberFormat = NumberFormat.getFloatInstance({
                maxFractionDigits: 4,
                groupingEnabled: true,
                groupingSeparator: ".",
                decimalSeparator: ","
            });

            if (isNaN(pValue)) {
                pValue = 0;
            }

            var text = oNumberFormat.format(pValue);
            return text;

        }
    };

}
);