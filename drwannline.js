/* global define */
define('DS/SWXWebLayoutCommands/SWXWebDrwAnnotationLineCmd', [
    'DS/SWXWebLayoutCommands/SWXWebDrwAnnotationLinePacket',
    'DS/SWXWebMBDCommands/SWXWebMBDCmd',
    'DS/CSICommandBinder/CSICommandBinder',
    'DS/SWXWebComponents/SWXWebMultiSelectionComponent',
    'DS/SWXWebUI/SWXGeomPathFilter',
    'DS/SWXWebMBDUtils/SWXWebMbdUtils',
    'DS/SWXWebMBDUtils/SWXWebMBDUtility'
],
    function (SWXWebDrwAnnotationLinePacket,
        SWXWebMBDCmd,
        CSICommandBinder,
        SWXWebMultiSelectionComponent,
        SWXGeomPathFilter,
        SWXWebMbdUtils,
        SWXWebMBDUtility) {
    'use strict';

    var Selections = 'Selections';

    return SWXWebMBDCmd.extend({
            packetDefinition: SWXWebDrwAnnotationLinePacket.packetDefinition,
        haveTooltips: true,             // load tooltips from _tt.CATNls
        componentConfig: [{
            compClass: SWXWebMultiSelectionComponent,
            parameters: {
                Parameter: Selections,
                MultiSelectDefault: 'MultiSelectDefault'
            },
            activeComponentOnly: false
        }],

        init: function (options) {
            this._parent(options);
        },

        onReady: function () {
            this._parent();
            var sel = this.packet.Selections.value[0];
            if (SWXGeomPathFilter.IsAnnDimensionType(sel)) {
                this.packet.AnnType._value = false;
            } else {
                this.packet.AnnType._value = true;
            }
            this.annLineService = this.createServiceProxy('SWXCSDrwAnnotationLineOperation');
            if (this.annLineService) {
                this.annLineService.beginAsync({
                    include: [Selections]
                }).then(function (params) {
                    this.onBeginCallback(params);
                }.bind(this));
            }            
        },

        onBeginCallback: function (params) {
            this._parent();
            this.initLineTypes();
            this.initThicknessList();
            this.updateUIDialog(params);
        },

        initLineTypes: function () {
            let fonts = this.getList();
            // Set the line type list
            this.packet.LineFonts.value = fonts.reduce(function (acc, font) {
                acc.push(font.name);
                return acc;
            }, []);
            // Set line icon list
            this.packet.LineIcons.value = fonts.reduce(function (acc, font) {
                acc.push(font.icon);
                return acc;
            }, []);
        },

        initThicknessList: function () {
            let fonts = this.getList(true);
            // Set the thickness list
            this.packet.ThicknessList.value = fonts.reduce(function (acc, font) {
                acc.push(font.name);
                return acc;
            }, []);
            // Set thickness icon list
            this.packet.ThicknessIcons.value = fonts.reduce(function (acc, font) {
                acc.push(font.icon);
                return acc;
            }, []);
        },

        updateUIDialog: function (params) {
            if (params && params.propertyMap_) {
                if (params.propertyMap_.hasOwnProperty('ExtThickness')) {
                    let thickness = params.readDouble('ExtThickness', 'double');
                    thickness = thickness.toString() + " mm";
                    if (this.packet.ThicknessList._value.includes(thickness)) {
                        let index = this.packet.ThicknessList._value.indexOf(thickness);
                        this.packet.ThicknessExt.value = index;
                    }
                }
                if (params.propertyMap_.hasOwnProperty('DimThickness')) {
                    let thickness = params.readDouble('DimThickness', 'double');
                    thickness = thickness.toString() + " mm";
                    if (this.packet.ThicknessList._value.includes(thickness)) {
                        let index = this.packet.ThicknessList._value.indexOf(thickness);
                        this.packet.ThicknessDim.value = index;
                    }
                }
                if (params.propertyMap_.hasOwnProperty('AnnThickness')) {
                    let thickness = params.readInt32('AnnThickness', 'int');
                    this.packet.ThicknessExt.value = thickness;
                }
            }
        },

        /**
        * @private
        * @description: Create a random list of line/thickness (name and icone name)
        * @returns {Array} Array of "line/thickness" objects (with font name and icon name)  
        */
        getList: function (thickness) {
            if (thickness) {
                let thicknList = ['0.13', '0.35', '0.7', '1', '1.4', '2', '2.3', '2.6'];
                // Create a list of thickness
                return (new Array(thicknList.length).fill()).reduce(function (acc, value, index) {
                    var thicknessStr = SWXWebMBDUtility.GetLineThicknessUnicode(index % thicknList.length);
                    acc.push({ name: (thicknList[index % thicknList.length]) + ' mm' + thicknessStr });
                    return acc;
                }, []);
            } else {
                // Create a list of line styles
                //IR 935057: Removed 63 types and added 7 relevant line style types.
                let lineTypesList = [this.resources.LineFontAnn.Case[0]._value, this.resources.LineFontAnn.Case[1]._value, this.resources.LineFontAnn.Case[2]._value,
                                     this.resources.LineFontAnn.Case[3]._value, this.resources.LineFontAnn.Case[4]._value, this.resources.LineFontAnn.Case[5]._value,
                                     this.resources.LineFontAnn.Case[6]._value];
                return (new Array(lineTypesList.length).fill()).reduce(function (acc, value, index) {
                    var styleStr = SWXWebMBDUtility.GetLineStyleUnicode(index % lineTypesList.length);
                    acc.push({ name: (lineTypesList[index % lineTypesList.length]) + styleStr });
                    return acc;
                }, []);
            }
        },

        onPacketChangeFromUI: function (iPaths) {
            if (iPaths.length) {
                if (iPaths[0] === 'ThicknessExt' || iPaths[0] === 'ThicknessDim' || iPaths[0] === 'LineFontAnn') {
                    var nonPacketParams = new CSICommandBinder.Parameters();
                    if (nonPacketParams) {
                        if (this.packet.AnnType._value === true) {
                            nonPacketParams.writeInt32('AnnThickness', this.packet.ThicknessExt._value);
                        }
                        else if (this.packet.AnnType._value === false) {
                            nonPacketParams.writeDouble('ExtThickness', parseFloat(this.packet.ThicknessList._value[this.packet.ThicknessExt._value]));
                            nonPacketParams.writeDouble('DimThickness', parseFloat(this.packet.ThicknessList._value[this.packet.ThicknessDim._value]));
                        }   
                    }
                    this.annLineService.doAsync({
                        csiParams: nonPacketParams
                    })
                }
            } else {
                this.doCancel();
                return;
            }
        },

        _onCommandEnd: function () {
            if (this.annLineService) {
                this.annLineService.endAsync({
                    include: []
                }).then(function (resultParam) {
                    this.annLineService = null;
                    delete this.annLineService;
                }.bind(this));
            }
        },

        onOK: function () {
            this._onCommandEnd();
            this._parent();
        },

        onCancel: function () {
            this._onCommandEnd();
            this._parent();
        }
    });
});
