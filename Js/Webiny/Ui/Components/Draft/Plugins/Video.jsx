import Webiny from 'Webiny';
const Utils = Webiny.Draft.Utils;

class VideoEditComponent extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            size: props.data.size,
            resizing: false
        };

        this.bindMethods('resize', 'resizeStart', 'resizeEnd', 'getSize', 'renderVideo');
    }

    alignVideo(align) {
        this.props.updateBlockData({align});
    }

    resizeStart(e) {
        this.setState({resizing: true});
        this.size = {
            width: this.refs.resizer.clientWidth,
            height: this.refs.resizer.clientHeight
        };

        this.aspectRatio = this.size.width / this.size.height;

        this.position = {
            x: e.clientX,
            y: e.clientY
        };
    }

    resize(e) {
        e.preventDefault();
        const deltaX = this.position.x - e.clientX;
        const deltaY = this.position.y - e.clientY;

        if (Math.abs(deltaX) > 200 || Math.abs(deltaY) > 200) {
            return;
        }

        if (deltaX !== 0) {
            this.size.width = this.size.width - deltaX;
            this.size.height = Math.round(this.size.width / this.aspectRatio);
        } else {
            this.size.height = this.size.height - deltaY;
            this.size.width = Math.round(this.size.height * this.aspectRatio);
        }

        this.position = {
            x: e.clientX,
            y: e.clientY
        };

        this.setState({size: this.size});
    }

    resizeEnd() {
        this.setState({resizing: false});
        this.props.updateBlockData({size: this.state.size});
    }

    getSize(offset = 0) {
        return {
            width: _.has(this.state, 'size.width') ? this.state.size.width - offset : 'auto',
            height: _.has(this.state, 'size.height') ? this.state.size.height - offset : 'auto'
        };
    }

    renderVideo() {
        const data = this.props.data;
        let props, embedUrl;

        if (data.type === 'youtube') {
            embedUrl = 'http://www.youtube.com/embed/' + data.videoId + '?wmode=transparent&autoplay=0&html5=1';
        } else {
            embedUrl = 'http://player.vimeo.com/video/' + data.videoId + '?wmode=transparent&autoplay=0&type=html5';
        }

        props = {
            src: embedUrl,
            width: this.getSize(2).width,
            height: this.getSize(2).height,
            frameBorder: 0,
            wmode: 'Opaque',
            allowFullScreen: true
        };

        return <iframe {...props}/>;
    }
}

VideoEditComponent.defaultProps = {
    renderer() {
        const captionChange = caption => this.props.updateBlockData({caption});

        const btnProps = (align) => {
            return {
                type: 'button',
                className: this.classSet('btn btn-default', {active: this.props.data.align === align}),
                onClick: this.alignVideo.bind(this, align)
            };
        };

        const draggable = {
            draggable: true,
            onDragStart: this.resizeStart,
            onDrag: this.resize,
            onDragEnd: this.resizeEnd
        };

        const resizeOverlay = {
            position: 'absolute',
            width: '100%',
            height: '100%'
        };

        return (
            <Webiny.Ui.LazyLoad modules={['Grid', 'Input']}>
                {(Ui) => (
                    <div className="video-plugin-wrapper">
                        <Ui.Grid.Row>
                            <Ui.Grid.Col xs={12}>
                                <div className="btn-group pull-right">
                                    <button {...btnProps('left')}>Left</button>
                                    <button {...btnProps('center')}>Center</button>
                                    <button {...btnProps('right')}>Right</button>
                                </div>
                            </Ui.Grid.Col>
                        </Ui.Grid.Row>

                        <div className={'video-wrapper'} style={{textAlign: this.props.data.align}}>
                            <div className="resizer" ref="resizer" style={this.getSize()}>
                                {this.state.resizing ? <div style={resizeOverlay}/> : null}
                                {this.renderVideo()}
                                <span className="resize-handle br" {...draggable}/>
                            </div>
                        </div>
                        <Ui.Input value={this.props.data.caption} onChange={captionChange} placeholder="Enter a caption for this video"/>
                    </div>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

class VideoComponent extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.bindMethods('renderVideo');
    }

    getSize(offset = 0) {
        return {
            width: _.has(this.props.data, 'size.width') ? this.props.data.size.width - offset : 'auto',
            height: _.has(this.props.data, 'size.height') ? this.props.data.size.height - offset : 'auto'
        };
    }

    renderVideo() {
        const data = this.props.data;
        let props, embedUrl;

        if (data.type === 'youtube') {
            embedUrl = 'http://www.youtube.com/embed/' + data.videoId + '?wmode=transparent&autoplay=0&html5=1';
        } else {
            embedUrl = 'http://player.vimeo.com/video/' + data.videoId + '?wmode=transparent&autoplay=0&type=html5';
        }

        props = {
            src: embedUrl,
            width: this.getSize().width,
            height: this.getSize().height,
            frameBorder: 0,
            wmode: 'Opaque',
            allowFullScreen: true
        };

        return <iframe {...props}/>;
    }
}

VideoComponent.defaultProps = {
    renderer() {
        return (
            <div className="video-plugin-wrapper">
                <div className={'video-wrapper'} style={{textAlign: this.props.data.align}}>
                    {this.renderVideo()}
                    <div>{this.props.data.caption}</div>
                </div>
            </div>
        );
    }
};

class VideoPlugin extends Webiny.Draft.AtomicPlugin {
    constructor(config = {}) {
        super(config);
        this.validate = _.get(config, 'validate', 'required');
        this.name = 'video';
        this.id = _.uniqueId('insertVideo-');
        this.formId = this.id + '-form';

        this.showDropdown = this.showDropdown.bind(this);
        this.submitForm = this.submitForm.bind(this);
    }

    parseYoutubeLink(link) {
        const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        return link.match(regex) ? RegExp.$1 : false;
    }

    parseVimeoLink(link) {
        if (link.indexOf('#') > 0) {
            const tmp = link.split('#');
            link = tmp[0];
        }

        let regex = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
        let id = link.match(regex) ? RegExp.$3 : false;
        if (!id) {
            // Try another regex
            regex = /vimeo\.com\/(?:video\/)?(\d+)/;
            id = link.match(regex) ? RegExp.$1 : false;
        }
        return id;
    }

    showDropdown() {
        this.editor.setReadOnly(true);
    }

    createVideoBlock(model) {
        model.plugin = this.name;
        const insert = {
            type: 'atomic',
            text: ' ',
            data: model
        };
        const editorState = Utils.insertDataBlock(this.editor.getEditorState(), insert);
        this.editor.setEditorState(editorState);
    }

    submitForm(model) {
        // Parse URL and detect type
        const data = _.clone(model);

        let url = model.url;
        let videoId;
        if ((videoId = this.parseYoutubeLink(url))) {
            data.type = 'youtube';
            data.videoId = videoId;
        } else if ((videoId = this.parseVimeoLink(url))) {
            data.type = 'vimeo';
            data.videoId = videoId;
        }

        this.createVideoBlock(data);
        this.ui(this.formId).resetForm();
        this.ui(this.id).close();
    }


    getEditConfig() {
        return {
            toolbar: () => {
                return (
                    <Webiny.Ui.LazyLoad modules={['Form', 'Input', 'Dropdown', 'Grid', 'Icon', 'Button']}>
                        {(Ui) => {
                            const props = {
                                ui: this.id,
                                title: <Ui.Icon icon="fa-video-camera"/>,
                                closeOnClick: false,
                                onShow: this.showDropdown
                            };
                            return (
                                <Ui.Dropdown {...props}>
                                    {() => (
                                        <Ui.Form ui={this.formId} onSubmit={this.submitForm}>
                                            {(model, form) => (
                                                <div style={{width: 400}}>
                                                    <Ui.Grid.Row>
                                                        <Ui.Grid.Col xs={12}>
                                                            <Ui.Input
                                                                name="url"
                                                                placeholder="Enter a video URL"
                                                                validate={this.validate}
                                                                showValidationIcon={false}/>
                                                        </Ui.Grid.Col>
                                                        <Ui.Grid.Col xs={12}>
                                                            <Ui.Button
                                                                type="primary"
                                                                align="right"
                                                                label="Insert video"
                                                                onClick={form.submit}/>
                                                        </Ui.Grid.Col>
                                                    </Ui.Grid.Row>
                                                </div>
                                            )}
                                        </Ui.Form>
                                    )}
                                </Ui.Dropdown>
                            );
                        }}
                    </Webiny.Ui.LazyLoad>
                );
            },
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: VideoEditComponent,
                        editable: false
                    };
                }
            }
        };
    }

    getPreviewConfig() {
        return {
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: VideoComponent,
                        editable: false
                    };
                }
            }
        };
    }
}

VideoPlugin.VideoEditComponent = VideoEditComponent;
VideoPlugin.VideoComponent = VideoComponent;

export default VideoPlugin;