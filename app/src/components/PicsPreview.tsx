import * as React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { NavigationScreenProps } from 'react-navigation';
import Toast from 'react-native-root-toast';
import Icon from './base/Icon';
import NavHeader from './base/NavHeader';
import ZoomImage from './base/ZoomImage';
import Swiper, { SwiperState } from 'react-native-swiper';
import { containerStyle } from '../utils/container';

export interface Pic {
    text: string;
    url: string;
}

export type PicsPreviewProps = NavigationScreenProps<{
    defaultActiveIndex?: number;
    pics: Pic[];
    onBack?: () => void;
}>;

export interface PicsPreviewState {
    activeIndex: number;
}

export default class PicsPreview extends React.Component<PicsPreviewProps, PicsPreviewState> {

    constructor(props: PicsPreviewProps) {
        super(props);
        this.state = {
            activeIndex: props.navigation.state.params.defaultActiveIndex || 0
        };
    }

    private onChange(e, state: SwiperState) {
        this.setState({ activeIndex: state.index });
    }

    private onBack() {
        const { params } = this.props.navigation.state;
        if (params.onBack) {
            params.onBack();
        } else {
            this.props.navigation.goBack();
        }
    }

    private savePic() {
        Toast.show('保存图片成功', { position: Toast.positions.CENTER });
    }

    public render() {
        const { pics } = this.props.navigation.state.params;
        const { activeIndex } = this.state;
        const swiperHeight = Dimensions.get('window').height - 110;

        return (
            <View style={[{ flex: 1, backgroundColor: '#000' }, containerStyle]}>
                <NavHeader
                    style={{ backgroundColor: '#000' }}
                    title={`${activeIndex + 1}/${pics.length}`}
                    titleStyle={{ color: '#fff', fontSize: 20 }}
                    backTitleStyle={{ color: '#fff' }}
                    onBack={this.onBack.bind(this)}
                />
                <Swiper index={activeIndex} showsPagination={false} height={swiperHeight} onMomentumScrollEnd={this.onChange.bind(this)} >
                    {
                        pics.map(pic => {
                            return (
                                <View key={pic.url} style={{ flex: 1 }}>
                                    <ZoomImage
                                        maximumZoomScale={3}
                                        orginHeight={swiperHeight}
                                        orginWidth={Dimensions.get('window').width}
                                        source={{ uri: pic.url }}
                                        onTap={() => this.onBack()}
                                        onLongPress={() => this.savePic()}
                                    >
                                    </ZoomImage>
                                    <Text style={{ position: 'absolute', left: 20, right: 0, bottom: 100 , color: '#ffffff' }}>{pic.text}</Text>
                                </View>
                            );
                        })
                    }
                </Swiper>
                <View style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}>
                    <Icon style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: 30 }} type='EvilIcons' name='share-apple' />
                </View>
            </View>
        );
    }
}