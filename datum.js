/*global define*/
define('DS/SWXWebMBDCommands/SWXWebMBDDatumCmd', [
    'DS/SWXWebMBDCommands/SWXWebMBDDatumPacket',
    'DS/SWXWebMBDCommands/SWXWebMBDAnnotationCmd',
    'DS/SWXWebUI/SWXSelectionPriority',
    'DS/SWXWebUI/SWXWebPacketUtils',
    'DS/SWXWebUI/SWXGeomPathFilter',
    'DS/SWXWebUtilities/SWXWAfrSpecTreeUtils',
    'DS/SWXWebUI/SWXWebPacketErrors',
    'DS/SWXWebUI/SWXWebUXTouchService',
    'DS/SWXWebComponents/SWXWebMultiSelectionComponent',
    'DS/SWXWebComponents/SWXWebMultiIndicationComponent',
    'DS/SWXWebComponents/SWXWebHighlightComponent',
    'DS/SWXWebComponents/SWXWebClickComponent',
    ],
    function (SWXWebMBDDatumPacket, SWXWebMBDAnnotationCmd, SWXSelectionPriority, SWXWebPacketUtils, SWXGeomPathFilter, SWXWAfrSpecTreeUtils, SWXWebPacketErrors,
        SWXWebUXTouchService, SWXWebMultiSelectionComponent, SWXWebMultiIndicationComponent, SWXWebHighlightComponent, SWXWebClickComponent) {
        'use strict';

        var _self = null;
        var Selections = "Selections";
        var GeomSelection = "GeomSelection";
        var AnnSelection = "AnnSelection";
        var LeaderAttachment = "LeaderAttachment";


        return SWXWebMBDAnnotationCmd.extend({
            packetDefinition: SWXWebMBDDatumPacket.packetDefinition,
            haveTooltips: true,             // load tooltips from _tt.CATNls
            componentConfig: [                
                {
                    id: 'multiSelection',
                    compClass: SWXWebMultiSelectionComponent,
                    parameters: {
                        Parameter: 'Selections',
                        Position3D: 'position3D',
                        PositionOnPlane: 'positionOnPlane',
                        RefPlane: '3dPlane',
                        SelectionPriority: SWXSelectionPriority.ActiveMBDCommandMap,
                        MultiSelectDefault: 'MultiSelectDefault',
                        LastPickPoint: 'pickPoint'
                    },
                    valuedFromCSO: true,
                    preserveCurrentCSO: true,
                    //maxSelections: 1,
                    activeComponentOnly: false
                },                
                {
                    id: 'multiSelectionGeom',
                    compClass: SWXWebMultiSelectionComponent,
                    parameters: {
                        Parameter: 'GeomSelection',
                        Position3D: 'position3D',
                        PositionOnPlane: 'positionOnPlane',
                        RefPlane: '3dPlane',
                        SelectionPriority: SWXSelectionPriority.DefaultMap,
                        MultiSelectDefault: 'MultiSelectDefault',
                        LastPickPoint: 'pickPoint'
                    },
                    //maxSelections: 1,
                    activeComponentOnly: false
                },
                {
                    id: 'multiSelectionAnn',
                    compClass: SWXWebMultiSelectionComponent,
                    parameters: {
                        Parameter: 'AnnSelection',
                        Position3D: 'position3D',
                        PositionOnPlane: 'positionOnPlane',
                        RefPlane: '3dPlane',
                        SelectionPriority: SWXSelectionPriority.DefaultMap,
                        MultiSelectDefault: 'MultiSelectDefault',
                        LastPickPoint: 'pickPoint'
                    },
                    maxSelections: 1,
                    activeComponentOnly: false
                },
                //V69: 2D authoring: Separate selection component for drawing to have higher pick priority for annotations.
                {
                    id: 'multiSelectionAnn2D',
                    compClass: SWXWebMultiSelectionComponent,
                    parameters: {
                        Parameter: 'AnnSelection',
                        Position3D: 'position3D',
                        PositionOnPlane: 'positionOnPlane',
                        RefPlane: '3dPlane',
                        SelectionPriority: SWXSelectionPriority.MBDActiveDrwMap,
                        MultiSelectDefault: 'MultiSelectDefault',
                        LastPickPoint: 'pickPoint'
                    },
                    maxSelections: 1,
                    activeComponentOnly: false
                },
                {
                    id: 'mouseIndication',
                    compClass: SWXWebMultiIndicationComponent,
                    parameters: {
                        SelectionArray: 'MISelections',     //should not select anything
                        Point3DArray: 'MIPosition3D',
                        RefPlane: '3dPlane',
                        PointArray: 'MIPositionOnPlane',
                        MaxPoints: 'MIMaxPoints',
                        SelPoint: 'MIPickPoint',
                        SkipPicking: 'MISkipPicking'
                    },
                    checkOnObject: false,
                    projectPointToPlane: true
                },
                {
                    id: 'annotationHighlightComp',
                    compClass: SWXWebHighlightComponent,
                    parameters: {
                        Parameter: 'AnnotationPath'
                    }
                }
            ],

            init: function (iOptions) {
                this._parent(iOptions);
                _self = this;
                this._cursor = 'mbdDatum';
            },
            getEditItemName: function () {
                return 'CATTPSNonSemanticDatum';
            },
            setItemID: function (id) {
                this._itemID = id;
            },

            setTransferredValues: function (iMap) {
                // overriding packet values passed through?
                this.transferredValues = iMap;
            },

            setTextEdit: function (editmode) {
                this.packet.AnnPlaced.value = editmode;
            },

            onSpaceClicked: function (data) {
                var selection = SWXWebPacketUtils.getPropertyValue(this.packet, Selections)._value;
                if (selection.length) {
                    this.setTextEdit(true);
                }
            },
            AttachmentType: function () {
                if (this.packet.Selections.value[0]) {
                    var sel = this.packet.Selections.value[0];
                    if (sel !== undefined && sel != null) {
                        var lastElem = sel.getLastElement();
                        if (lastElem != undefined && lastElem != null) {
                            var objId = SWXWAfrSpecTreeUtils.getNodeTypeId(lastElem);
                            if (objId === null || objId === undefined || objId === "") {
                                if (SWXGeomPathFilter.IsAnnGTolType(sel) || SWXGeomPathFilter.IsAnnDimensionType(sel)) {
                                    return "Annotation";
                                }
                                else if (!SWXGeomPathFilter.MBDSelection(sel)) {
                                    return "Geometry";
                                }
                            }
                            else if (objId === "CATTPSNonSemanticDimension" || objId === "CATTPSNonSemanticGDT") {
                                return "Annotation";
                            }
                        }                        
                    }
                }
            },
            beginExecute: function () {
                this._parent();
            },
            onReady: function () {
                _self = this;
                this._lastReference = null;
                this._name = 'Datum';
                this._OperationName = 'SWXCSMBDDatumOperation';
                this._parent();
                //deactivate-multi indication (not doing so will prevent manipulation of robot during edit)
                //_self.mouseIndication.deactivate();
                //for preselection 
                if ((this._preselection === true || this._preselectionAnnAttach === true) && !SWXWebUXTouchService.isTouchMode()) {
                    _self.activateComponent(this.mouseIndication);
                }
                //setting attribute of Datum Name input to allow max 2 characters
                if (document.getElementsByTagName("textarea") && document.getElementsByClassName("wux-ui-state-undefined") && document.getElementsByTagName("textarea").length > 0)
                    document.getElementsByTagName("textarea")[0].setAttribute("maxlength", "2");
            },
            onPacketChange: function (iPaths) {
                var syncVisu = false;

                if (iPaths.length > 0 && _self.packet[iPaths[0]]._source === 'UI') {
                    if (iPaths[0] === 'AnnName' || iPaths[0] === "SymbolStyle" || iPaths[0] === "NoSelectionOK")
                        syncVisu = true;
                }

                if (iPaths.length > 0 && _self.packet[iPaths[0]]._source === 'UI') {
                    if (_self.packet.AnnPlaced.value === true) {
                        if (iPaths[0] === LeaderAttachment) {
                            syncVisu = true;
                        }
                    }
                }

                if (iPaths.includes(AnnSelection)) {
                    if (_self.packet.AnnPlaced.value === true) syncVisu = true; // dont need to sync when component is switched after placing (causes issue in touch)
                    if (_self.packet.AnnSelection.value.length > 0) {
                        if (_self._lastReference !== undefined && _self._lastReference !== null && (!_self._lastReference.isEqual(_self.packet.AnnSelection.value[0]))) {
                            _self.packet.RefChanged._value = true;
                        }
                        _self._lastReference = _self.packet.AnnSelection.value[0];
                    }
                    else if (_self.packet.AnnSelection.value.length === 0) {
                        _self._lastReference = null;
                    }
                }
                if (iPaths.includes(GeomSelection)) {
                    if (_self.packet.AnnPlaced.value === true) syncVisu = true; // dont need to sync when component is switched after placing (causes issue in touch)
                    if (_self.packet.GeomSelection.value.length > 0) {
                        if (_self._lastReference !== undefined && _self._lastReference !== null && (!_self._lastReference.isEqual(_self.packet.GeomSelection.value[0]))) {
                            _self.packet.RefChanged._value = true;
                        }
                        _self._lastReference = _self.packet.GeomSelection.value[0];
                    }
                    else if (_self.packet.GeomSelection.value.length === 0) {
                        _self._lastReference = null;
                    }
                }
                if (iPaths.includes(Selections)) {
                    var AttachmentType = _self.AttachmentType();
                    var selection = [];
                    if (_self.packet.Selections.value.length > 0) selection = _self.packet.Selections.value;
                    if (AttachmentType != undefined && AttachmentType != null && selection.length > 0) {                                               
                        if (AttachmentType === "Annotation") {                            
                            //event update mode of packet is set to notify at end because of selection component 
                            _self.packet._notifyImmediate(function () {
                                _self.packet[LeaderAttachment].setValue(AttachmentType);
                                _self.packet[AnnSelection].value = selection;
                            });
                            if (SWXWebUXTouchService.isTouchMode())
                                _self.activateComponent(_self.multiSelectionGeom);
                        }
                        else if (AttachmentType === "Geometry") {
                            //event update mode of packet is set to notify at end because of selection component
                            _self.packet._notifyImmediate(function () {
                                _self.packet[LeaderAttachment].setValue(AttachmentType);
                                _self.packet[GeomSelection].value = selection;
                            });
                            if (SWXWebUXTouchService.isTouchMode())
                                _self.activateComponent(_self.multiSelectionGeom);
                        }
                        if (!SWXWebUXTouchService.isTouchMode()) {
                            _self.activateComponent(this.mouseIndication);
                        }
                        _self._lastReference = selection[0];
                    }
                }
                if (iPaths.includes("MIPosition3D")) {
                    if (_self.packet.MIPosition3D.value.length > 0) {
                        _self.packet.position3D.value = _self.packet.MIPosition3D.value[0];
                        syncVisu = true;
                    }
                }
                if (iPaths.includes("MIPositionOnPlane")) {
                    if (_self.packet.MIPositionOnPlane.value.length > 0) {
                        _self.packet.positionOnPlane.value = _self.packet.MIPositionOnPlane.value[0];
                        syncVisu = true;
                    }
                }
                if (iPaths.includes("MIPickPoint")) {
                    var leaderAttachment = _self.packet[LeaderAttachment].value;
                    if (leaderAttachment === "Annotation") 
                        _self.activateComponent(_self.multiSelectionAnn);
                    else if (leaderAttachment === "Geometry")
                        _self.activateComponent(_self.multiSelectionGeom);
                    _self.onSpaceClicked();
                }
                if (iPaths.includes(LeaderAttachment)) {
                    const leaderAttachment = _self.packet[LeaderAttachment].value;
                    //V69: 2D Authoring: Activate 'multiSelectionAnn2D' component which has higher pick priority for annotations when user wants to attach to dimension or GTol.
                    if (_self.isDrawingMode() && leaderAttachment === "Annotation") {
                        _self.activateComponent(_self.multiSelectionAnn2D);
                    }

                    if (_self.packet.AnnPlaced.value === true) {           
                        if (leaderAttachment === "Annotation") {
                            _self.activateComponent(_self.multiSelectionAnn);
                            _self.packet[GeomSelection].value = [];
                            //_self._lastReference = null;
                        }
                        else if (leaderAttachment === "Geometry") {
                            _self.activateComponent(_self.multiSelectionGeom);
                            _self.packet[AnnSelection].value = [];
                            //_self._lastReference = null;
                        }
                    }
                }
                if (iPaths.includes("IllegalAttachment") && _self.packet.IllegalAttachment.value > 0) {
                    if (_self.packet.AnnPlaced.value === false) {
                        _self.activateComponent(_self.multiSelection);
                        _self.packet[AnnSelection]._value = [];
                        _self.packet._events.dispatchEvent('change', [[AnnSelection]]);
                    }
                    SWXWebPacketErrors.clearAllErrors();
                    var error = _self.packet.IllegalAttachment.value;
                    SWXWebPacketErrors.setGeneralErrorMessage(this.resources.Warning['IllegalAttachment' + error], SWXWebPacketErrors.WARNING, "");
                    _self._lastReference = null;
                    _self.packet.IllegalAttachment._value = 0;
                }
                if (iPaths.includes("RobotDragAngular") && _self.packet.Blob2DRobotHidden2._value) {
                    if (_self.packet.RobotDragAngular._value === "Begin" || _self.packet.RobotDragAngular._value === "Drag")
                        _self.packet.RobotHidden2.value = true;
                    else
                        _self.packet.RobotHidden2.value = false;
                }
                
                _self._parent(iPaths, syncVisu);
            },
            onOK: function () {
                SWXWebPacketErrors.clearAllErrors();
                if (this.packet[GeomSelection].value.length <= 0 && this.packet[AnnSelection].value.length <= 0) {
                    this.packet['NoSelectionOK'].setValue(true);
                }
                this._lastReference = null;
                //this.activateComponent(this.multiSelection);
                this._parent();
                return true;
            },

            onCancel: function () {
                SWXWebPacketErrors.clearAllErrors();
                this._parent();
                return true;
            },
            endExecute: function () {
                this.setTextEdit(false);
                this._parent();
            },
        });
    });
