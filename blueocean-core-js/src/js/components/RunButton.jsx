/**
 * Created by cmeyers on 8/26/16.
 */

import React, { Component, PropTypes } from 'react';
import { Icon } from 'react-material-icons-blue';

import { RunApi as runApi } from '../';
import { SseBus as sseBus } from '../';
import { ToastService as toastService } from '../';
import { buildRunDetailsUrl } from '../UrlBuilder';

const stopProp = (event) => {
    event.stopPropagation();
};

/**
 * Run Buttons allows a pipeline or branch to be run and also be stopped thereafter.
 */
export class RunButton extends Component {

    constructor(props) {
        super(props);

        this.subscriptionId = null;
        this.awaitingJobEvent = false;

        this.state = {
            running: false,
            stopping: false,
        };
    }

    componentDidMount() {
        this.subscriptionId = sseBus.subscribeToJob(
            (runData, event) => this._onJobEvent(runData, event),
            (event) => this._filterJob(event)
        );
    }

    componentWillUnmount() {
        if (this.subscriptionId) {
            sseBus.unsubscribe(this.subscriptionId);
        }
    }

    _onJobEvent(runData, event) {
        if (!this.awaitingJobEvent) {
            return;
        }

        const name = decodeURIComponent(
            event.job_ismultibranch ? event.blueocean_job_branch_name : event.blueocean_job_pipeline_name
        );
        const runId = event.jenkins_object_id;

        if (event.jenkins_event === 'job_run_started') {
            const runDetailsUrl = buildRunDetailsUrl(runData);

            toastService.newToast({
                text: `Started "${name}" #${runId}`,
                action: 'Open',
                onActionClick: () => {
                    if (this.props.onNavigation) {
                        this.props.onNavigation(runDetailsUrl);
                    }
                },
            });

            this.awaitingJobEvent = false;
        } else if (event.jenkins_event === 'job_run_ended' && runData.result === 'ABORTED') {
            toastService.newToast({
                text: `Stopped "${name}" #${runId}`,
            });

            this.awaitingJobEvent = false;
        }

    }

    _filterJob(event) {
        return event.blueocean_job_rest_url === this.props.runnable._links.self.href;
    }

    _onRunClick() {
        runApi.startRun(this.props.runnable);

        const name = this.props.runnable.name;

        this.awaitingJobEvent = true;

        toastService.newToast({
            text: `Queued "${name}"`,
        });
    }

    _onStopClick() {
        runApi.stopRun(this.props.latestRun);

        const name = this.props.runnable.name;
        const runId = this.props.latestRun.id;

        this.awaitingJobEvent = true;

        toastService.newToast({
            text: `Stopping "${name}" #${runId}...`,
        });
    }

    render() {
        const outerClass = this.props.className ? this.props.className : '';
        const outerClassNames = outerClass.split(' ');
        const innerButtonClass = outerClassNames.indexOf('icon-button') === -1 ? 'btn inverse' : '';
        const stopClass = this.state.stopping ? 'stopping' : '';

        const status = this.props.latestRun ? this.props.latestRun.state : '';
        const runningStatus = status && (status.toLowerCase() === 'running' || status.toLowerCase() === 'queued');

        return (
            <div className={`run-button-component ${outerClass}`} onClick={(event => stopProp(event))}>
                { !runningStatus &&
                <a className={`run-button ${innerButtonClass}`} title="Run" onClick={() => this._onRunClick()}>
                    <Icon size={24} icon="play_circle_outline" />
                    <span className="button-label">Run</span>
                </a>
                }

                { runningStatus &&
                <a className={`stop-button ${innerButtonClass} ${stopClass}`} title="Stop" onClick={() => this._onStopClick()}>
                    <div className="btn-icon"></div>
                    <span className="button-label">Stop</span>
                </a>
                }
            </div>
        );
    }
}

RunButton.propTypes = {
    className: PropTypes.string,
    runnable: PropTypes.object,
    latestRun: PropTypes.object,
    onNavigation: PropTypes.func,
};