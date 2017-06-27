import * as React from 'react';
import { View, Image, NavState } from 'react-native';
import { Actions } from 'react-native-router-flux';
import WebViewBridge, { WebViewMessge } from '../components/base/WebViewBridge';
import { AppState } from '../reducers';
import { Article } from '../interfaces';
import { domain } from '../constants/config';
import connectComponent, { ConnectComponentProps } from '../utils/connectComponent';

interface ArticleContainerProps {
    id: number;
}

interface StateProps {
    article?: Article;
}

interface ArticleContainerState {
}

type Props = ArticleContainerProps & StateProps & ConnectComponentProps;

class ArticleContainer extends React.Component<Props, ArticleContainerState> {

    constructor(props) {
        super(props);
        this.state = {
            loaded: false
        };
    }

    public componentDidMount() {
        if (!this.props.article) {
            this.props.actions.getArticleById(this.props.id);
        }
    }

    private onLoadEnd() {
    }

    private onLoadError(nav: NavState) {
        console.log('webview load error');
    }

    private onBridgeMessage(data: WebViewMessge) {
        if (data.name === 'qdaily::picsPreview') {
            console.log('pics', data.options);
        } else {
            console.log('onBridgeMessage', data);
        }
    }

    private onLinkPress(url: string) {
        const match = url.match(/http:\/\/m.qdaily.com\/mobile\/articles\/(.*).html/);
        const articleId = match && match[1];
        if (articleId) {
            Actions['article']({ id: articleId });
        } else {
            console.log('onLinkPress', url);
        }
    }

    private renderLoading() {
        return (
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Image style={{ width: 180, height: 120, alignSelf: 'center' }} source={require('../../res/imgs/pen_pageloading.gif')} />
            </View>
        );
    }

    public render() {
        const { article } = this.props;
        if (!article) {
            return this.renderLoading();
        }
        return (
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <WebViewBridge
                    startInLoadingState={true}
                    renderLoading={() => this.renderLoading()}
                    onLoadEnd={this.onLoadEnd.bind(this)}
                    onError={this.onLoadError.bind(this)}
                    onBridgeMessage={this.onBridgeMessage.bind(this)}
                    onLinkPress={this.onLinkPress.bind(this)}
                    source={{ html: article.body, baseUrl: domain }}
                />
            </View>
        );
    }
}

function mapStateToProps(state: AppState, ownProps?: ArticleContainerProps): StateProps {
    const { id } = ownProps;
    const article = state.article.articles[id];

    return {
        article: article
    };
}

export default connectComponent({
    LayoutComponent: ArticleContainer,
    mapStateToProps: mapStateToProps
});