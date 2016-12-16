$(function() {
    $('#fullpage').fullpage({
        // verticalCentered: false,
        anchors: ['page1', 'page2', 'page3', 'page4', 'page5'],
        // autoScrolling true表示没有滚动条，false则有滚动条，默认true
        autoScrolling:true,
        loopBottom: true,
        // continuousVertical 和loopTop、loopBottom还有scrollBar: true、autoScrolling: false都不兼容
        // continuousVertical: true
        // scrollBar: true,
        // fixedElements: '#header'
        navigation: true,
        navigationPosition: 'right',
        navigationTooltips: ['导航', '菜单', '特色菜', '特写', '联系<br>我们'],
        /*slidesNavigation: true,
        slidesNavPosition: 'top',
        controlArrows: false*/
        afterLoad: function (link, index) {
            switch (index) {
                case 1:
                    move('.index-banner .text-logo')
                        .set('opacity', 1)
                        .duration('1s')
                        .end();
                    move('.index-banner .text-info')
                        .set('margin-top', '18px')
                        .duration('1s')
                        .end();
                    break;
                case 2:
                    move('.index-menu .menu-tips')
                        .set('background', '#f34949')
                        .duration('1s')
                        .end();
                    move('.index-menu .menu-list')
                        .set('opacity', 1)
                        .duration('1s')
                        .end();
                    move('.index-menu .expand')
                        .set('opacity', 1)
                        .duration('1s')
                        .end();
                    break;
                case 3:
                    move('.my-slider')
                        .set('opacity', 1)
                        .duration('1s')
                        .end();
                    break;
                case 4:
                    move('.index-pics')
                        .set('opacity', 1)
                        .duration('1s')
                        .end();
                    break;
                case 5:
                    break;
                default:
                    break;
            }
        },
        // 注意onLeave方法默认有三个参数，第一个参数是当前要离开的页面，第二个是离开后要前往的页面，如果把index放到了第二个参数的位置就会有重复动画的bug
        onLeave: function (index) {
            switch (index) {
                case 1:
                    move('.index-banner .text-logo')
                        .set('opacity', 0)
                        .end();
                    move('.index-banner .text-info')
                        .set('margin-top', '800px')
                        .end();
                    break;
                case 2:
                    move('.index-menu .menu-tips')
                        .set('background', '#fff')
                        .end();
                    move('.index-menu .menu-list')
                        .set('opacity', 0.7)
                        .end();
                    move('.index-menu .expand')
                        .set('opacity', 0)
                        .end();
                    break;
                case 3:
                    move('.my-slider')
                        .set('opacity', 0)
                        .end();
                    break;
                case 4:
                    move('.index-pics')
                        .set('opacity', 0)
                        .end();
                    break;
                case 5:
                    break;
                default:
                    break;
            }
        },
        afterRender: function (link, index) {
            switch (index) {
                case 1:
                    break;
                case 2:
                    break;
                case 3:
                    break;
                case 4:
                    break;
                case 5:
                    break;
                default:
                    break;
            }
        },
    });
    $('.my-slider').unslider({
        dots: true,
        // animation: 'fade',
        arrows: false,
        autoplay: true,
        infinite: true
    });
});