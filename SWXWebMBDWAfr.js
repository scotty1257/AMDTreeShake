/*global define, require,*/
//
// SWXWebMBDWAfr
// New framework code

define('DS/SWXWebMBDApp/SWXWebMBDWAfr',
    [
        'DS/SWXWebApplication/SWXWebBaseMainWAfr',
        'DS/CoreEvents/Events',
        'DS/SWXWebMBDUtils/SWXWebMBDConditionalLoader2',
        'DS/SWXWebMBDUtils/SWXWebMbdUtils',
        'DS/SWXWebMBDUtils/SWXWebMbdUtils2',
        'DS/SWXWebMBDUtils/SWXWebMbdUtils3',
        'DS/SWXWebMBDUtils/SWXWebMbdUtils4',
        'DS/SWXWebMBDUtils/SWXWebMBDUtility',
        'DS/SWXWebUtilities/SWXEventTypes',
        'DS/SWXWebUtilities/SWXWAfrContextUtils',
        'DS/SWXWebUI/SWXWebProgress',
        'DS/SWXWebCommands/SWXWebToggleViewFilterCmd'
    ], function (SWXWebBaseMainWAfr, WUXEvent, SWXWebMBDConditionalLoader2, SWXWebMbdUtils, SWXWebMBDUtility, SWXEventTypes, SWXWAfrContextUtils, SWXWebProgress, SWXWebToggleViewFilterCmd, SWXWebMbdUtils2, SWXWebMbdUtils3,SWXWebMbdUtils4) {
        var MBDApp = SWXWebBaseMainWAfr.Extend();
        var suppressedfilters = [];
        let staticPC = 0;
        let dynamicPC = 0;

        MBDApp.prototype.getWidgetHelpPath = function() {
            return 'SWXWebMBDApp/assets/help/' + this.getId();
        }

        MBDApp.prototype.setUp = async function (sourceApp) {
            this.setUpCommon(sourceApp);

            // BKB Remove this code when we are able to load components with proper dependencies
            var ctx = this.getExecutionContext();

            //enabling proper state for enabled or disabled commands in different viewing mode
            var availabilityModesComponents = ctx.getComponent('AFR_AvailabilityModesComponent');
            availabilityModesComponents.publish({ mode: 'VIEWING_MODE', value: '2D' });
            availabilityModesComponents.publish({ mode: 'VIEWING_MODE', value: '3D' });

            var legacyComp = ctx.getComponent('SWXWebMainLegacyComponent');
            if (legacyComp) {
                legacyComp.load();
            }
            //remove app specific view filters
            suppressedfilters = SWXWebToggleViewFilterCmd.setAppSpecificViewFilterCmds(['SWXWebConstraintsFilter', 'SWXWebSketchesFilter']);

            sourceApp.done();

            // BKB Use getTargetApp() to determine if we are in an app switch situation
            if ( ctx.getTargetApp())
            {
                await SWXWAfrContextUtils.executeHandler(ctx, {
                    id: 'SWXWebMBDSwitchRootAction',
                    args: {
                        enter: true
                    }
                });
            }

            //Disable pixel culling for xDrawing
            let viewerComp = ctx.getComponent('Viewer');
            if (viewerComp) {
                let viewer = viewerComp.get3DViewer();
                if(viewer){
                    staticPC = viewer.getPixelCulling('static');
                    dynamicPC = viewer.getPixelCulling('dynamic');
                    viewer.setPixelCulling(0);
                }
            }

            //Enable Section Capping for app
            if (viewerComp) {
                let viewer = viewerComp.get3DViewer();
                if (viewer) {
                    viewer.setSectionCapping(true);
                }
            }

            SWXWebMBDConditionalLoader2.addUI(); //IR-632950
            if (window.performance.navigation.type == 1) { //refresh
                var loadingId = WUXEvent.subscribe({ event: SWXEventTypes.LoadingComponent() }, async function (data) {
                    if (!data) { //true: before loading, false: after loading
                        WUXEvent.unsubscribe(loadingId);
                        /* var isDrawing = await SWXWebMbdUtils.isDrawingMode();
                        if (isDrawing) {
                            await SWXWAfrContextUtils.setCheckState(ctx, {
                                id: 'SWXWebDrwDrawingMode',
                                state: true
                            }, true);
                        } else */{

                            //on session refresh
                            if (SWXWebMbdUtils.getAnnotationSetVersion() === "LegacyMBD") {
                                await SWXWAfrContextUtils.executeHandler(ctx, {
                                    id: 'SWXWebMBDUpdateLegacyData'
                                });
                            }

                            /*   IR-994022-GSA13 - SWXWebMBDActivateView_Activate value not getting clean as SWXWebMBDActivateView not getting initiated.
                            // Activate Default 3DView
                            const key = 'SWXWebMBDActivateView_Activate';
                            if (ctx) {
                                let stComp = ctx.getComponent('SWXWAfrStateTransferComponent');
                                if (stComp) {
                                    stComp.setValue(key, { ViewID: true, ViewName: true, Activate: false });
                                }
                            }
                            var activateView = SWXWAfrContextUtils.executeHandler(ctx, {
                                id: "SWXWebMBDActivateView"
                            });
                            SWXWebProgress.show("", activateView);
                            await activateView;*/

                            SWXWebMBDUtility.applyVisualizationMode(ctx, false); //3D
                        }
                    }
                });
            }
        };

        MBDApp.prototype.onWillEnter = function (sourceApp) {

            this.onWillEnterCommon(sourceApp);

            //Disable pixel culling for xDrawing
            if (sourceApp) {
                const ec = sourceApp.getExecutionContext();
                if (ec) {
                    let viewerComp = ec.getComponent('Viewer');
                    if(viewerComp){
                        let viewer = viewerComp.get3DViewer();
                        if(viewer){
                            viewer.setPixelCulling(0);
                        }
                    }
                }
            }



            // I am called here means that my app will enter in an existing execution context
            // currently occupied by another app.
            //the execution context is not set at this time, so get if from the source App
            return SWXWebMbdUtils.UpdateMBDVisibility(true);
        };

        MBDApp.prototype.onWillLeave = async function (targetApp) {
            // TODO do my stuff
            // return a resolve promise if my app accepts to leave this context
            // otherwise return a reject promise then the transition of the target app into my context
            // will be canceled
            //return Promise.resolve();
            SWXWebToggleViewFilterCmd.resetAppSpecificViewFilterCmds(suppressedfilters);
            const ec = this.getExecutionContext();
            if (ec) {
                if (SWXWAfrContextUtils.getCheckState(ec, 'SWXWebDrwDrawingMode')) {
                    await SWXWAfrContextUtils.setCheckState(ec, {
                        id: 'SWXWebDrwDrawingMode',
                        state: false,
                    }, true);
                }
                const appSwitcher = ec.getComponent('SWXWAfrAppSwitcherComponent');
                if (appSwitcher) {
                    const targetAppId = targetApp.getId();
                    await appSwitcher.doPreTransitionRequirements(targetAppId);
                }

                await SWXWAfrContextUtils.executeHandler(ec, {
                    id: 'SWXWebMBDSwitchRootAction',
                    args: {
                        enter: false
                    }
                });

                let viewerComp = ec.getComponent('Viewer');
                if(viewerComp){
                    let viewer = viewerComp.get3DViewer();
                    if(viewer){
                        viewer.setPixelCulling(staticPC, 'static');
                        viewer.setPixelCulling(dynamicPC, 'dynamic');
                    }
                }
            }
            await this.onWillLeaveCommon(targetApp);
        };

        MBDApp.prototype.getTitle = function () {
            return 'xDrawing';
        };

        MBDApp.prototype.DefaultCommand = 'SWXWebMBDDefaultCmd';

        return MBDApp;
    });
