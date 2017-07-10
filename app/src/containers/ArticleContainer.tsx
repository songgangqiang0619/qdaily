import * as React from 'react';
import {
    View, Image, Text, Animated, Easing, NavState, StyleSheet, ViewStyle, TextStyle, Platform,
    PanResponder, PanResponderInstance, GestureResponderEvent, PanResponderGestureState
} from 'react-native';
import { NavigationScreenProps } from 'react-navigation';
import Icon from '../components/base/Icon';
import WebViewBridge, { WebViewMessge } from '../components/base/WebViewBridge';
import { AppState } from '../reducers';
import { Article, Feed, Post } from '../interfaces';
import { domain } from '../constants/config';
import connectComponent, { ConnectComponentProps } from '../utils/connectComponent';

type ArticleContainerProps = NavigationScreenProps<{
    id: number
}>;

interface StateProps {
    detail?: Article;
    info?: Feed;
}

interface ArticleContainerState {
    bottomBarBottom: Animated.Value;
    loaded: boolean;
}

type Props = StateProps & ConnectComponentProps & ArticleContainerProps;

const scrollScript = require('../../res/other/scroll.js');

class ArticleContainer extends React.Component<Props, ArticleContainerState> {

    private panResponder: PanResponderInstance;
    private panDirection = '';

    constructor(props) {
        super(props);
        this.state = {
            bottomBarBottom: new Animated.Value(0),
            loaded: false
        };

        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponderCapture: () => true,
            onPanResponderMove: this.onPanResponderMove.bind(this)
        });
    }

    public componentDidMount() {
        const { params } = this.props.navigation.state;
        if (!this.props.info) {
            this.props.actions.getArticleInfoById(params.id);
        }
        if (!this.props.detail) {
            this.props.actions.getArticleDetailById(params.id);
        }
    }

    private onPanResponderMove(e: GestureResponderEvent, gestureState: PanResponderGestureState) {
        if (gestureState.dy > 0) {
            this.updateBar('up');
        } else {
            this.updateBar('down');
        }
    }

    private updateBar(direction: string) {
        if (direction === this.panDirection) {
            return;
        }
        if (direction === 'down') {
            if (Platform.OS === 'android') {
                this.state.bottomBarBottom.setValue(48);
            } else {
                Animated.timing(this.state.bottomBarBottom, {
                    duration: 100,
                    toValue: 48,
                    easing: Easing.in(Easing.ease)
                }).start();
            }
            this.updateStautsBar(false);
        } else {
            Animated.timing(this.state.bottomBarBottom, {
                duration: 100,
                toValue: 0,
                easing: Easing.in(Easing.ease)
            }).start();
            if (direction === 'bottom') {
                this.updateStautsBar(false);
            } else {
                this.updateStautsBar(true);
            }
        }
        this.panDirection = direction;
    }

    private updateStautsBar(visible: boolean) {
        // if (Platform.OS === 'android') {
        //     StatusBar.setTranslucent(!visible);
        // } else {
        //     StatusBar.setHidden(!visible, 'slide');
        // }
    }

    private onLoadEnd() {
        if (!this.state.loaded) {
            setTimeout(() => {
                this.setState({ loaded: true });
            }, 300);
        }
    }

    private onLoadError(nav: NavState) {
        console.log('webview load error');
    }

    private onBridgeMessage(data: WebViewMessge) {
        const { navigate } = this.props.navigation;
        if (data.name === '_toNative::onScroll') {
            const direction = data.options;
            this.updateBar(direction);
        } else if (data.name === 'qdaily::picsPreview') {
            navigate('picsPreview', {
                defaultActiveIndex: data.options.cur,
                pics: data.options.pics
            });
        } else {
            console.log('onBridgeMessage', data);
        }
    }

    private onLinkPress(url: string) {
        const { navigate } = this.props.navigation;
        const match = url.match(/http:\/\/m.qdaily.com\/mobile\/articles\/(.*).html/);
        const articleId = match && match[1];
        if (articleId) {
            navigate('article', { id: articleId });
        } else {
            navigate('ad', { url });
        }
    }

    private renderLoading() {
        return (
            <View style={styles.loading}>
                <Image style={{ width: 180, height: 120, alignSelf: 'center' }} source={require('../../res/imgs/pen_pageloading.gif')} />
            </View>
        );
    }

    private renderWebView() {
        const { detail } = this.props;
        if (!detail) {
            return null;
        }
        let panProps;
        if (Platform.OS === 'ios') {
            panProps = this.panResponder.panHandlers;
        } else {
            panProps = Object.create(null);
        }
        return (
            <View style={{ flex: 1 }} {...panProps}>
                <WebViewBridge
                    onLoadEnd={this.onLoadEnd.bind(this)}
                    onError={this.onLoadError.bind(this)}
                    onBridgeMessage={this.onBridgeMessage.bind(this)}
                    onLinkPress={this.onLinkPress.bind(this)}
                    injectedJavaScript={scrollScript}
                    decelerationRate='normal'
                    source={{ html: detail.body, baseUrl: domain }}
                />
            </View>
        );
    }

    private renderBadgeIcon(name: string, badge?: number) {
        if (badge === 0) {
            badge = undefined;
        }
        return (
            <View style={styles.badge}>
                <Icon style={styles.badgeIcon} type='EvilIcons' name={name} />
                <Text style={styles.badgeText}>{badge}</Text>
            </View>
        );
    }

    private renderBottomBar() {
        const { info = {} } = this.props;
        const { post = {} as Post } = info as Feed;
        return (
            <Animated.View style={[styles.bottomBar, { transform: [{ translateY: this.state.bottomBarBottom }] }]}>
                <Icon style={styles.backIcon} type='EvilIcons' name='chevron-left' onPress={() => this.props.navigation.goBack()} />
                {this.renderBadgeIcon('comment', post.comment_count)}
                {this.renderBadgeIcon('heart', post.praise_count)}
                {this.renderBadgeIcon('share-apple')}
            </Animated.View>
        );
    }

    public render() {
        return (
            <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
                {this.renderWebView()}
                {this.renderBottomBar()}
                {this.state.loaded ? null : this.renderLoading()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    loading: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        backgroundColor: '#ffffff'
    } as ViewStyle,
    bottomBar: {
        position: 'absolute',
        borderTopColor: '#eeeeee',
        borderTopWidth: 1,
        bottom: 0,
        left: 0,
        right: 0,
        height: 48,
        paddingHorizontal: 25,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#ffffff'
    } as ViewStyle,
    backIcon: {
        position: 'absolute',
        left: 20,
        fontSize: 40
    } as TextStyle,
    badge: {
        marginLeft: 25
    } as ViewStyle,
    badgeIcon: {
        fontSize: 30
    } as TextStyle,
    badgeText: {
        position: 'absolute',
        left: 26,
        top: 0,
        fontSize: 10
    } as TextStyle,

});

function mapStateToProps(state: AppState, ownProps?: ArticleContainerProps): StateProps {
    const { params } = ownProps.navigation.state;
    const detail = state.article.detail[params.id];
    const info = state.article.info[params.id];
    return {
        detail: detail,
        info: info
    };
}

export default connectComponent({
    LayoutComponent: ArticleContainer,
    mapStateToProps: mapStateToProps
});