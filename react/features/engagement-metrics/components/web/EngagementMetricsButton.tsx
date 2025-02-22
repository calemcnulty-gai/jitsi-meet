import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';

import { IconEngagement } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { openEngagementModal } from '../../actions';
import { IReduxState } from '../../../app/types';

interface IProps extends AbstractButtonProps {
    dispatch: ThunkDispatch<IReduxState, void, AnyAction>;
}

/**
 * Component that renders a toolbar button for the engagement metrics.
 */
class EngagementMetricsButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.engagementMetrics';
    icon = IconEngagement;
    label = 'toolbar.showEngagementMetrics';
    tooltip = 'toolbar.showEngagementMetrics';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        console.log('[EngagementMetricsButton] Button clicked - Opening modal!');
        this.props.dispatch(openEngagementModal());
    }
}

export default connect()(EngagementMetricsButton); 