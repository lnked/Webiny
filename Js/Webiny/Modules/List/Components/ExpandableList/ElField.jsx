import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;

class ElField extends Webiny.Ui.Component {

}

ElField.defaultProps = {
    renderer() {
        let content = this.props.children;
        if (_.isFunction(this.props.children)) {
            content = this.props.children.call(this, this.props.data, this);
        }

        let className = _.union([], [this.props.className]);
        className = _.join(className, ' ');

        return (
            <div className={className + ' expandable-list__row__fields__field flex-cell flex-width-' + this.props.all} onClick={this.props.onClick}>{content}</div>
        );
    }
};

export default ElField;