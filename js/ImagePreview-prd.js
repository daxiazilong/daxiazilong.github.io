/**
 * image-preview 1.0.0
 * author:zilong 
 * https://github.com/daxiazilong
 * Released under the MIT License
 */
var ImagePreview = /** @class */ (function () {
    function ImagePreview(options) {
        this.options = options;
        this.showTools = true;
        this.lastClick = -Infinity; // 上次点击时间和执行单击事件的计时器
        this.curIndex = 0; //当前第几个图片
        this.imgContainerMoveX = 0; //图片容器x轴的移动距离
        this.imgContainerMoveY = 0; //图片容器y轴的移动距离
        this.screenWidth = window.innerWidth; //屏幕宽度
        this.slideTime = 300; //切换至下一屏幕时需要的时间
        this.zoomScale = 0.05; //缩放比例
        this.isZooming = false; //是否在进行双指缩放
        this.isAnimating = false; // 是否在动画中
        this.isMotionless = true; // 是否没有产生位移
        this.isEnlargeMove = false; // 大图下得切屏
        this.prefix = "__";
        this.defToggleClass = 'defToggleClass';
        this.movePoints = []; //收集移动点，判断滑动方向
        this.fingerDirection = ''; //当前手指得移动方向
        this.operateMaps = {
            rotateLeft: 'handleRotateLeft',
            rotateRight: 'handleRotateRight'
        };
        if (options.selector) {
            this.bindTrigger();
        }
        this.genFrame();
        this.handleReausetAnimate(); //requestAnimationFrame兼容性
        this.threshold = this.screenWidth / 4;
        this.imgContainer = this.ref.querySelector("." + this.prefix + "imgContainer");
        this.imgItems = this.imgContainer.querySelectorAll("." + this.prefix + "item");
        this.reCordInitialData(this.imgItems);
        this.maxMoveX = this.screenWidth / 2;
        this.minMoveX = -this.screenWidth * (this.imgsNumber - 0.5);
        this.ref.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.ref.addEventListener('touchmove', this.handleMove.bind(this));
        this.ref.addEventListener('touchend', this.handleToucnEnd.bind(this));
        this.ref.querySelector("." + this.prefix + "close").addEventListener('touchstart', this.close.bind(this));
    }
    ImagePreview.prototype.bindTrigger = function () {
        var images = [];
        var triggerItems = document.querySelectorAll(this.options.selector);
        if (!triggerItems.length) {
            // some operate
        }
        triggerItems.forEach(function (element, index) {
            images.push(element.dataset.src);
        });
        this.options.curImg = images[0];
        this.options.imgs = images;
        var imgPreviewer = this;
        triggerItems.forEach(function (element, index) {
            element.addEventListener('click', function (e) {
                imgPreviewer.show(index);
            });
        });
    };
    ImagePreview.prototype.reCordInitialData = function (els) {
        var _this = this;
        /**
         * 记录并设置初始top，left值
         */
        var imgContainerRect = this.imgContainer.getBoundingClientRect();
        var imgContainerHeight = imgContainerRect.height;
        els.forEach(function (el, key, parent) {
            var img = el.querySelector('img');
            var imgRect = img.getBoundingClientRect();
            if (img.complete) {
                var imgContainerRect_1 = _this.imgContainer.getBoundingClientRect();
                var imgContainerHeight_1 = imgContainerRect_1.height;
                var imgContainerWidth = imgContainerRect_1.width;
                var styleObj = el.getBoundingClientRect();
                if (imgContainerHeight_1 < styleObj.height) {
                    el.style.cssText = "\n                        height: 100%;\n                        width: auto;\n                    ";
                    img.style.cssText = "\n                        height: 100%;\n                        width: auto;\n                    ";
                }
                styleObj = el.getBoundingClientRect();
                var top_1 = (imgContainerHeight_1 - styleObj.height) / 2;
                var left = (imgContainerWidth - styleObj.width) / 2;
                el.dataset.initialWidth = styleObj.width.toString();
                el.dataset.initialHeight = styleObj.height.toString();
                el.dataset.top = top_1.toString();
                el.dataset.initialTop = top_1.toString();
                el.dataset.left = left.toString();
                el.dataset.initialLeft = left.toString();
                el.dataset.loaded = "true";
                el.style.top = top_1 + "px";
                el.style.left = left + "px";
            }
            else {
                el.dataset.loaded = "false";
                img.onload = (function (el) {
                    return function () {
                        var imgContainerRect = this.imgContainer.getBoundingClientRect();
                        var imgContainerHeight = imgContainerRect.height;
                        var imgContainerWidth = imgContainerRect.width;
                        var styleObj = el.getBoundingClientRect();
                        if (imgContainerHeight < styleObj.height) {
                            el.style.cssText = "\n                                height: 100%;\n                                width: auto;\n                            ";
                            img.style.cssText = "\n                                height: 100%;\n                                width: auto;\n                            ";
                        }
                        styleObj = el.getBoundingClientRect();
                        var top = (imgContainerHeight - styleObj.height) / 2;
                        var left = (imgContainerWidth - styleObj.width) / 2;
                        el.dataset.initialWidth = styleObj.width.toString();
                        el.dataset.initialHeight = styleObj.height.toString();
                        el.dataset.top = top.toString();
                        el.dataset.initialTop = top.toString();
                        el.dataset.left = left.toString();
                        el.dataset.initialLeft = left.toString();
                        el.dataset.loaded = "true";
                        el.style.top = top + "px";
                        el.style.left = left + "px";
                    };
                })(el).bind(_this);
                img.onerror = (function (el) {
                    return function (e) {
                        var imgContainerRect = this.imgContainer.getBoundingClientRect();
                        var imgContainerHeight = imgContainerRect.height;
                        var styleObj = el.getBoundingClientRect();
                        var top = (imgContainerHeight - styleObj.height) / 2;
                        el.dataset.initialWidth = styleObj.width.toString();
                        el.dataset.initialHeight = styleObj.height.toString();
                        el.dataset.top = top.toString();
                        el.dataset.initialTop = top.toString();
                        el.dataset.loaded = "false";
                        el.style.top = top + "px";
                        (e.currentTarget).alt = "图片加载错误";
                    };
                })(el).bind(_this);
            }
        });
    };
    ImagePreview.prototype.handleTouchStart = function (e) {
        // preventDefault is very import, because if not do this, we will get 
        // an error last-Click-Time on wx.
        e.preventDefault();
        switch (e.touches.length) {
            case 1:
                this.handleOneStart(e);
                break;
            case 2:
                this.handleTwoStart(e);
                break;
            default:
                break;
        }
    };
    ImagePreview.prototype.handleTwoStart = function (e) {
        this.curPoint1 = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        this.curPoint2 = {
            x: e.touches[1].clientX,
            y: e.touches[1].clientY
        };
    };
    ImagePreview.prototype.handleOneStart = function (e) {
        /**
         * 这里把操作派发
         */
        var _this = this;
        var type = (e.target).dataset.type;
        if (this.operateMaps[type]) {
            this[this.operateMaps[type]](e);
            return;
        }
        this.touchStartX = this.startX = Math.round(e.touches[0].clientX);
        this.touchStartY = this.startY = Math.round(e.touches[0].clientY);
        if ((new Date()).getTime() - this.lastClick < 300) {
            /*
                启动一个定时器，如果双击事件发生后就
                取消单击事件的执行
             */
            clearTimeout(this.performerClick);
            this.handleDoubleClick(e);
        }
        else {
            this.performerClick = setTimeout(function () {
                _this.handleClick(e);
            }, 300);
        }
        this.lastClick = (new Date()).getTime();
        this.getMovePoints(e);
    };
    ImagePreview.prototype.handleRotateLeft = function (e) {
        var _this = this;
        var curItem = this.imgItems[this.curIndex];
        var rotateDeg;
        if (curItem.dataset.loaded == 'false') {
            // 除了切屏之外对于加载错误的图片一律禁止其他操作
            return;
        }
        if (curItem.dataset.rotateDeg) {
            rotateDeg = Number(curItem.dataset.rotateDeg);
        }
        else {
            rotateDeg = 0;
        }
        rotateDeg -= 90;
        this.isAnimating = true;
        curItem.style.cssText += "\n            transition: transform 0.5s;\n            transform: rotateZ( " + rotateDeg + "deg );\n        ";
        setTimeout(function () {
            curItem.dataset.rotateDeg = rotateDeg.toString();
            _this.isAnimating = false;
        }, 550);
    };
    ImagePreview.prototype.handleRotateRight = function (e) {
        var _this = this;
        var curItem = this.imgItems[this.curIndex];
        var rotateDeg;
        if (curItem.dataset.loaded == 'false') {
            // 除了切屏之外对于加载错误的图片一律禁止其他操作
            return;
        }
        if (curItem.dataset.rotateDeg) {
            rotateDeg = Number(curItem.dataset.rotateDeg);
        }
        else {
            rotateDeg = 0;
        }
        rotateDeg += 90;
        this.isAnimating = true;
        curItem.style.cssText += "\n            transition: transform 0.5s;\n            transform: rotateZ( " + rotateDeg + "deg );\n        ";
        setTimeout(function () {
            curItem.dataset.rotateDeg = rotateDeg.toString();
            _this.isAnimating = false;
        }, 550);
    };
    ImagePreview.prototype.handleClick = function (e) {
        var close = (this.ref.querySelector("." + this.prefix + "close"));
        var bottom = (this.ref.querySelector("." + this.prefix + "bottom"));
        this.showTools = !this.showTools;
        if (this.showTools) {
            close.style.display = 'block';
            bottom.style.display = 'block';
        }
        else {
            close.style.display = 'none';
            bottom.style.display = 'none';
        }
    };
    ImagePreview.prototype.handleDoubleClick = function (e) {
        if (this.isAnimating)
            return;
        this.isAnimating = true;
        var curItem = this.imgItems[this.curIndex];
        var curImg = curItem.querySelector('img');
        if (curItem.dataset.loaded == 'false') {
            // 除了切屏之外对于加载错误的图片一律禁止其他操作
            this.isAnimating = false;
            return;
        }
        var curItemWidth = curItem.getBoundingClientRect().width;
        var curItemHeight = curItem.getBoundingClientRect().height;
        var rotateDeg = Number(curItem.dataset.rotateDeg || '0');
        var toWidth;
        var toHeight;
        if (Math.abs(rotateDeg % 360) == 90 || Math.abs(rotateDeg % 360) == 270) {
            if (curImg.naturalWidth > curItemHeight) {
                toWidth = curImg.naturalHeight;
            }
            else {
                toWidth = curItemHeight;
            }
            if (curImg.naturalHeight > curItemWidth) {
                toHeight = curImg.naturalWidth;
            }
            else {
                toHeight = curItemWidth;
            }
        }
        else {
            if (curImg.naturalWidth > curItemWidth) {
                toWidth = curImg.naturalWidth;
            }
            else {
                toWidth = curItemWidth;
            }
            if (curImg.naturalHeight > curItemHeight) {
                toHeight = curImg.naturalHeight;
            }
            else {
                toHeight = curItemHeight;
            }
        }
        var scaleX;
        var scaleY;
        var isBigSize = curItem.dataset.isEnlargement == "enlargement";
        if (isBigSize) { //当前浏览元素为大尺寸时执行缩小操作，小尺寸执行放大操作
            switch (Math.abs(rotateDeg % 360)) {
                case 0:
                case 180:
                    scaleX = Number(curItem.dataset.initialWidth) / curItemWidth;
                    scaleY = Number(curItem.dataset.initialHeight) / curItemHeight;
                    break;
                case 90:
                case 270:
                    scaleX = Number(curItem.dataset.initialWidth) / curItemHeight;
                    scaleY = Number(curItem.dataset.initialHeight) / curItemWidth;
                    break;
                default:
                    break;
            }
        }
        else {
            scaleX = toWidth / curItemWidth;
            scaleY = toHeight / curItemHeight;
        }
        ;
        if (scaleX > 1 && scaleY > 1) { //放大
            this.setToNaturalImgSize(scaleX, scaleY, e);
        }
        else if (scaleX < 1 && scaleY < 1) {
            this.setToInitialSize(scaleX, scaleY, e);
        }
        else {
            this.isAnimating = false;
        }
    };
    ImagePreview.prototype.setToNaturalImgSize = function (scaleX, scaleY, e) {
        var _this = this;
        /**
         * 踩坑记
         * transform-origin 的参考点始终时对其初始位置来说的
         * scale之后的元素, 实际的偏移路径等于 translate 的位移等于 位移 * scale
         */
        var mouseX = e.touches[0].clientX;
        var mouseY = e.touches[0].clientY;
        var curItem = this.imgItems[this.curIndex];
        var curImg = curItem.querySelector('img');
        // 以下为旋转之后缩放时需要用到的参数
        var curItemViewTop = curItem.getBoundingClientRect().top; //当前元素距离视口的top
        var curItemViewLeft = curItem.getBoundingClientRect().left; //当前元素距离视口的left
        var curItemTop = Number(curItem.dataset.top) || 0;
        var curItemLeft = Number(curItem.dataset.left) || 0;
        var rotateDeg = Number(curItem.dataset.rotateDeg || '0');
        var centerX = Number(curItem.dataset.initialWidth) / 2;
        var centerY = Number(curItem.dataset.initialHeight) / 2;
        var toWidth;
        var toHeight;
        if (Math.abs(rotateDeg % 360) == 90 || Math.abs(rotateDeg % 360) == 270) {
            toWidth = curImg.naturalHeight;
            toHeight = curImg.naturalWidth;
        }
        else {
            toWidth = curImg.naturalWidth;
            toHeight = curImg.naturalHeight;
        }
        curItem.dataset.viewTopInitial = curItemViewTop.toString();
        curItem.dataset.viewLeftInitial = curItemViewLeft.toString();
        switch (rotateDeg % 360) {
            case 0:
                curItem.style.cssText = ";\n                    top:" + curItemTop + "px;\n                    left:" + curItemLeft + "px;\n                    transform-origin: " + centerX + "px " + centerY + "px;\n                    transform: \n                        rotateZ(" + rotateDeg + "deg) \n                        scale3d(" + scaleX + "," + scaleY + ",1) \n                        translateY(" + (-(mouseY - curItemViewTop - centerY) * (scaleY - 1)) / scaleY + "px) \n                        translateX(" + (-(mouseX - curItemViewLeft - centerX) * (scaleX - 1)) / scaleX + "px) \n                    ;\n                ";
                break;
            case -180:
            case 180:
                curItem.style.cssText = ";\n                    top:" + curItemTop + "px;\n                    left: " + curItemLeft + "px;\n                    transform-origin: " + centerX + "px " + centerY + "px;\n                    transform: \n                        rotateZ(" + rotateDeg + "deg) scale3d(" + scaleX + "," + scaleY + ",1) \n                        translateY(" + ((mouseY - curItemViewTop - centerY) * (scaleY - 1)) / scaleY + "px) \n                        translateX(" + ((mouseX - curItemViewLeft - centerX) * (scaleX - 1)) / scaleX + "px) \n                    ;\n                ";
                break;
            case -90:
            case 270:
                /**
                 * 笔记：
                 * 以 y轴偏移距离，因为旋转 -90或270度之后，
                 * y轴的位移实际又translateX控制，所以需要translateX控制其偏移
                 * (mouseY - curItemViewTop - centerX) * (scaleX -1 ) 是一个点缩放前后产生的位移偏差
                 * 再除以scaleX是因为啥呢，是因为上边可能讲过 translate x px 实际效果是 x * scaleX 的大小
                 */
                curItem.style.cssText = ";\n                    top: " + curItemTop + "px;\n                    left: " + curItemLeft + "px;\n                    transform-origin: " + centerX + "px " + centerY + "px ; \n                    transform: \n                        rotateZ(" + rotateDeg + "deg) \n                        scale3d(" + scaleX + "," + scaleY + ",1) \n                        translateX(" + ((mouseY - curItemViewTop - centerX) * (scaleX - 1)) / scaleX + "px) \n                        translateY(" + (-(mouseX - curItemViewLeft - centerY) * (scaleY - 1)) / scaleY + "px) \n                    ;\n                    \n                ";
                break;
            case -270:
            case 90:
                curItem.style.cssText = ";\n                        top: " + curItemTop + "px;\n                        left: " + curItemLeft + "px;\n                        transform-origin: " + centerX + "px " + centerY + "px ; \n                        transform: \n                            rotateZ(" + rotateDeg + "deg) \n                            scale3d(" + scaleX + "," + scaleY + ",1) \n                            translateX(" + (-(mouseY - curItemViewTop - centerX) * (scaleX - 1)) / scaleX + "px) \n                            translateY(" + ((mouseX - curItemViewLeft - centerY) * (scaleY - 1)) / scaleY + "px) \n                        ;\n                        \n                    ";
                break;
            default:
                break;
        }
        // 放大之后 图片相对视口位置不变
        var scaledX;
        var scaledY;
        if (Math.abs(rotateDeg % 360) == 90 || Math.abs(rotateDeg % 360) == 270) {
            scaledX = (mouseX - curItemLeft) * scaleY;
            scaledY = (mouseY - curItemTop) * scaleX;
        }
        else {
            scaledX = (mouseX - curItemLeft) * scaleX;
            scaledY = (mouseY - curItemTop) * scaleY;
            // 以y轴偏移的计算为例，以下是setTimout 计算时公式的推导
            //- ( mouseY - curItemTop ) * (scaleY - 1) - curItemTop)
            // = curItemTop -  (mouseY - curItemTop)  * (scaleY - 1)   ;
            // = curItemTop - ( mouseY- curItemTop)*scaleY + (mouseY - curItemTop)   
            // = mouseY - ( mouseY- curItemTop)*scaleY
            //  = - (scaledY - mouseY)
        }
        setTimeout(function () {
            if (Math.abs(rotateDeg % 360) == 90 || Math.abs(rotateDeg % 360) == 270) {
                curItem.style.cssText = ";\n                    transform: rotateZ(" + rotateDeg + "deg);\n                    width: " + toHeight + "px;\n                    height: " + toWidth + "px;\n                    left: " + -(scaledX - mouseX) + "px;\n                    top: " + -(scaledY - mouseY) + "px;\n                    transition: none;\n                ";
            }
            else {
                curItem.style.cssText = ";\n                    transform: rotateZ(" + rotateDeg + "deg);\n                    width: " + toWidth + "px;\n                    height: " + toHeight + "px;\n                    left: " + -(scaledX - mouseX) + "px;\n                    top: " + -(scaledY - mouseY) + "px;\n                    transition: none;\n                ";
            }
            curItem.dataset.top = "" + -(scaledY - mouseY);
            curItem.dataset.left = "" + -(scaledX - mouseX);
            curItem.dataset.isEnlargement = 'enlargement';
            _this.isAnimating = false;
        }, 550);
    };
    ImagePreview.prototype.setToInitialSize = function (scaleX, scaleY, e) {
        var _this = this;
        var curItem = this.imgItems[this.curIndex];
        var curItemWidth = curItem.getBoundingClientRect().width;
        var curItemHeight = curItem.getBoundingClientRect().height;
        // 以下为旋转之后缩放时需要用到的参数
        var curItemViewTop = curItem.getBoundingClientRect().top; //当前元素距离视口的top
        var curItemViewLeft = curItem.getBoundingClientRect().left; //当前元素距离视口的left
        var rotateDeg = Number(curItem.dataset.rotateDeg || '0');
        var toWidth;
        var toHeight;
        if (Math.abs(rotateDeg % 360) == 90 || Math.abs(rotateDeg % 360) == 270) {
            toWidth = curItemHeight;
            toHeight = curItemWidth;
        }
        else {
            toWidth = curItemWidth;
            toHeight = curItemHeight;
        }
        switch (rotateDeg % 360) {
            case 0:
                var centerX = curItemWidth / 2;
                var centerY = curItemHeight / 2;
                var top_2 = Number(curItem.dataset.top);
                var left = Number(curItem.dataset.left) || 0;
                var viewTopInitial = Number(curItem.dataset.initialTop);
                var viewLeftInitial = Number(curItem.dataset.initialLeft);
                var disteanceY = curItemViewTop + (centerY) * (1 - scaleY) - top_2 - viewTopInitial;
                var distanceX = curItemViewLeft + (centerX) * (1 - scaleX) - left - viewLeftInitial;
                curItem.style.cssText = ";\n                    top:" + curItem.dataset.top + "px;\n                    left:" + curItem.dataset.left + "px;\n                    width: " + toWidth + "px;\n                    height: " + toHeight + "px;\n                    transform-origin: " + centerX + "px " + centerY + "px;\n                    transform: \n                        rotateZ(" + rotateDeg + "deg) \n                        scale3d(" + scaleX + "," + scaleY + ",1) \n                        translateX(" + -(left + distanceX) / scaleX + "px) \n                        translateY(" + -(top_2 + disteanceY) / scaleY + "px)\n                    ;\n                ";
                break;
            case 180:
            case -180:
                {
                    var centerX_1 = curItemWidth / 2;
                    var centerY_1 = curItemHeight / 2;
                    var viewTopInitial_1 = Number(curItem.dataset.initialTop);
                    var viewLeftInitial_1 = Number(curItem.dataset.initialLeft);
                    var top_3 = Number(curItem.dataset.top);
                    var left_1 = Number(curItem.dataset.left) || 0;
                    var disteanceY_1 = curItemViewTop + (centerY_1) * (1 - scaleY) - top_3 - viewTopInitial_1;
                    var distanceX_1 = curItemViewLeft + (centerX_1) * (1 - scaleX) - left_1 - viewLeftInitial_1;
                    curItem.style.cssText = ";\n                        top:" + top_3 + "px;\n                        left:" + left_1 + "px;\n                        width: " + toWidth + "px;\n                        height: " + toHeight + "px;\n                        transform-origin: " + centerX_1 + "px " + centerY_1 + "px;\n                        transform: \n                            rotateZ(" + rotateDeg + "deg) \n                            scale3d(" + scaleX + "," + scaleY + ",1) \n                            translateX(" + (left_1 + distanceX_1) / scaleX + "px) \n                            translateY(" + (top_3 + disteanceY_1) / scaleY + "px)\n                        ;\n                    ";
                }
                break;
            case -90:
            case 270:
                {
                    var centerX_2 = curItemHeight / 2;
                    var centerY_2 = curItemWidth / 2;
                    var viewTopInitial_2 = Number(curItem.dataset.viewTopInitial);
                    var viewLeftInitial_2 = Number(curItem.dataset.viewLeftInitial);
                    var top_4 = Number(curItem.dataset.top);
                    var left_2 = Number(curItem.dataset.left);
                    /**
                     * 缩小的时候要时的图像的位置向原始位置靠近
                     * 以y轴得位移举例
                     * 放大之后 再缩小时 图像顶部移动的距离  centerX*(1-scaleY)
                     *  这个式子是这么推导而来的  Math.abs(centerX* scaleY - centerX)
                     * (这是缩放前后产生的位移距离)，
                     * 减去top（这是使用translate抵消top时产生的y轴位移，使其位置和top等于0时的位置一样）
                     * 这个时候就能得到缩小之后图像距离视口顶部的距离，然后再减去原始的高度（变形前的高度）
                     * 就得到了我们最终需要使其在y轴上偏移的距离
                     */
                    var disteanceY_2 = curItemViewTop + (centerX_2) * (1 - scaleY) - top_4 - viewTopInitial_2;
                    var distanceX_2 = curItemViewLeft + (centerY_2) * (1 - scaleX) - left_2 - viewLeftInitial_2;
                    curItem.style.cssText = ";\n                        top:" + top_4 + "px;\n                        left:" + left_2 + "px;\n                        width: " + toWidth + "px;\n                        height: " + toHeight + "px;\n                        transform-origin: " + centerX_2 + "px " + centerY_2 + "px 0;\n                        transform: \n                            rotateZ(" + rotateDeg + "deg) \n                            scale3d(" + scaleX + "," + scaleY + ",1) \n                            translateX(" + (top_4 + disteanceY_2) / scaleY + "px) \n                            translateY(" + -(left_2 + distanceX_2) / scaleX + "px)\n                        ;\n\n                    ";
                }
                break;
            case 90:
            case -270:
                {
                    var centerX_3 = curItemHeight / 2;
                    var centerY_3 = curItemWidth / 2;
                    var viewTopInitial_3 = Number(curItem.dataset.viewTopInitial);
                    var viewLeftInitial_3 = Number(curItem.dataset.viewLeftInitial);
                    var top_5 = Number(curItem.dataset.top);
                    var left_3 = Number(curItem.dataset.left);
                    var disteanceY_3 = curItemViewTop + (centerX_3) * (1 - scaleY) - top_5 - viewTopInitial_3;
                    var distanceX_3 = curItemViewLeft + (centerY_3) * (1 - scaleX) - left_3 - viewLeftInitial_3;
                    curItem.style.cssText = ";\n                        top:" + top_5 + "px;\n                        left:" + left_3 + "px;\n                        width: " + toWidth + "px;\n                        height: " + toHeight + "px;\n                        transform-origin: " + centerX_3 + "px " + centerY_3 + "px 0;\n                        transform: \n                            rotateZ(" + rotateDeg + "deg) \n                            scale3d(" + scaleX + "," + scaleY + ",1) \n                            translateX(" + -(top_5 + disteanceY_3) / scaleY + "px) \n                            translateY(" + (left_3 + distanceX_3) / scaleX + "px)\n                        ;\n\n                    ";
                }
                break;
            default:
                break;
        }
        curItem.dataset.top = curItem.dataset.initialTop;
        curItem.dataset.left = curItem.dataset.initialLeft;
        setTimeout(function () {
            curItem.style.cssText = ";\n                                transform: rotateZ(" + rotateDeg + "deg);\n                                top:" + Number(curItem.dataset.initialTop) + "px;\n                                left: " + Number(curItem.dataset.initialLeft) + "px;\n                                width: " + curItem.dataset.initialWidth + "px;\n                                height: " + curItem.dataset.initialHeight + "px;\n                                transition: none; \n                                ";
            {
                /**
                 * bug fix on ios,
                 * frequent zoom with double-click may
                 * cause img fuzzy
                 */
                var curImg_1 = curItem.querySelector("img");
                var preImgStyle_1 = curImg_1.style.cssText;
                curImg_1.style.cssText = "\n                    width: 100%;\n                    height: 100%;\n                ";
                setTimeout(function () {
                    curImg_1.style.cssText = preImgStyle_1;
                }, 10);
            }
            curItem.dataset.isEnlargement = 'shrink';
            _this.isAnimating = false;
        }, 550);
    };
    ImagePreview.prototype.handleMove = function (e) {
        var _this = this;
        e.preventDefault();
        if (this.isAnimating) {
            return;
        }
        // 双指缩放时的处理
        if (e.touches.length == 2) {
            clearTimeout(this.performerRecordMove);
            clearTimeout(this.performerClick);
            this.performerRecordMove = 0;
            this.handleZoom(e);
            return;
        }
        var curTouchX = e.touches[0].clientX;
        var curTouchY = e.touches[0].clientY;
        if ((this.touchStartX - curTouchX) > 2 && Math.abs(this.touchStartY - curTouchY) > 2) {
            clearTimeout(this.performerClick);
        }
        var curItem = this.imgItems[this.curIndex];
        var isBoundaryLeft = curItem.dataset.toLeft == 'true';
        var isBoundaryRight = curItem.dataset.toRight == 'true';
        var direction = e.touches[0].clientX - this.startX > 0 ? 'right' : 'left';
        this.isMotionless = false;
        /* 收集一段时间之内得移动得点，用于获取当前手指得移动方向
         * 如果手指方向已经确定了 则按手指方向做出操作，否则 启动开始收集手指移动得点
         * 并启动一个计时器 一定时间之后处理移动方向
         **/
        if (this.fingerDirection) {
            this.performerRecordMove = 0;
            if (curItem.dataset.isEnlargement == 'enlargement') {
                // 放大的时候的移动是查看放大后的图片
                // 放大的时候,如果到达边界还是进行正常的切屏操作
                // 重置是否已到达边界的变量,如果容器内能容纳图片则不需要重置
                var imgContainerRect = this.imgContainer.getBoundingClientRect();
                var conWidth = imgContainerRect.width;
                var curItemViewLeft = curItem.getBoundingClientRect().left;
                var curItemViewRight = curItem.getBoundingClientRect().right;
                // 对于长图单独处理，长图就是宽度可以容纳在当前容器内，但是高度很高的图片
                if (curItemViewLeft >= 0 && curItemViewRight <= conWidth) {
                    if (((isBoundaryLeft && direction == 'right') ||
                        (isBoundaryRight && direction == 'left') ||
                        (this.isEnlargeMove)) &&
                        (this.fingerDirection == 'horizontal')) {
                        this.isEnlargeMove = true;
                        this.handleMoveNormal(e);
                    }
                    else {
                        this.handleMoveEnlage(e);
                    }
                }
                else {
                    if ((isBoundaryLeft && direction == 'right') || (isBoundaryRight && direction == 'left') || (this.isEnlargeMove)) {
                        this.isEnlargeMove = true;
                        this.handleMoveNormal(e);
                    }
                    else {
                        this.handleMoveEnlage(e);
                    }
                }
            }
            else {
                //正常情况下的移动是图片左右切换
                this.handleMoveNormal(e);
            }
        }
        else {
            this.getMovePoints(e);
            if (this.performerRecordMove) {
                return;
            }
            this.performerRecordMove = setTimeout(function () {
                var L = _this.movePoints.length;
                if (L == 0)
                    return;
                var endPoint = _this.movePoints[L - 1];
                var startPoint = _this.movePoints[0];
                var dx = endPoint.x - startPoint.x;
                var dy = endPoint.y - startPoint.y;
                var degree = Math.atan2(dy, dx) * 180 / Math.PI;
                if (Math.abs(90 - Math.abs(degree)) < 30) {
                    _this.fingerDirection = 'vertical';
                }
                else {
                    _this.fingerDirection = 'horizontal';
                }
                if (curItem.dataset.isEnlargement == 'enlargement') {
                    // 放大的时候的移动是查看放大后的图片
                    // 放大的时候,如果到达边界还是进行正常的切屏操作
                    // 重置是否已到达边界的变量,如果容器内能容纳图片则不需要重置
                    var imgContainerRect = _this.imgContainer.getBoundingClientRect();
                    var conWidth = imgContainerRect.width;
                    var curItemViewLeft = curItem.getBoundingClientRect().left;
                    var curItemViewRight = curItem.getBoundingClientRect().right;
                    // 对于长图单独处理，长图就是宽度可以容纳在当前容器内，但是高度很高的图片
                    if (curItemViewLeft >= 0 && curItemViewRight <= conWidth) {
                        if (((isBoundaryLeft && direction == 'right') ||
                            (isBoundaryRight && direction == 'left') ||
                            (_this.isEnlargeMove)) &&
                            (_this.fingerDirection == 'horizontal')) {
                            _this.isEnlargeMove = true;
                            _this.handleMoveNormal(e);
                        }
                        else {
                            _this.handleMoveEnlage(e);
                        }
                    }
                    else {
                        if ((isBoundaryLeft && direction == 'right') || (isBoundaryRight && direction == 'left') || (_this.isEnlargeMove)) {
                            _this.isEnlargeMove = true;
                            _this.handleMoveNormal(e);
                        }
                        else {
                            _this.handleMoveEnlage(e);
                        }
                    }
                }
                else {
                    //正常情况下的移动是图片左右切换
                    _this.handleMoveNormal(e);
                }
            }, 25);
        }
    };
    ImagePreview.prototype.handleMoveNormal = function (e) {
        var curX = Math.round(e.touches[0].clientX);
        var offset = curX - this.startX;
        this.imgContainerMoveX += offset;
        if (this.imgContainerMoveX > this.maxMoveX) {
            this.imgContainerMoveX = this.maxMoveX;
        }
        else if (this.imgContainerMoveX < this.minMoveX) {
            this.imgContainerMoveX = this.minMoveX;
        }
        this.startX = curX;
        this.imgContainer.style.left = this.imgContainerMoveX + "px";
    };
    ImagePreview.prototype.handleMoveEnlage = function (e) {
        var imgContainerRect = this.imgContainer.getBoundingClientRect();
        var conWidth = imgContainerRect.width;
        var conHeight = imgContainerRect.height;
        var curItem = this.imgItems[this.curIndex];
        if (curItem.dataset.loaded == 'false') {
            // 除了切屏之外对于加载错误的图片一律禁止其他操作
            return;
        }
        var curItemWidth = curItem.getBoundingClientRect().width;
        var curItemHeihgt = curItem.getBoundingClientRect().height;
        var viewLeft = curItem.getBoundingClientRect().left;
        var viewRight = curItem.getBoundingClientRect().right;
        var curX = Math.round(e.touches[0].clientX);
        var curY = Math.round(e.touches[0].clientY);
        var offsetX = curX - this.startX;
        var offsetY = curY - this.startY;
        var curItemTop = Number(curItem.dataset.top);
        var curItemLeft = Number(curItem.dataset.left);
        var curTop;
        var curLeft;
        // 如果容器内能完整展示图片就不需要移动
        if (viewLeft < 0 || viewRight > conWidth) {
            curLeft = curItemLeft + offsetX;
        }
        else {
            curLeft = curItemLeft;
        }
        if (curItemHeihgt > conHeight) {
            curTop = curItemTop + offsetY;
        }
        else {
            curTop = curItemTop;
        }
        curItem.style.cssText += "\n            top: " + curTop + "px;\n            left: " + curLeft + "px;\n        ";
        curItem.dataset.top = (curTop).toString();
        curItem.dataset.left = (curLeft).toString();
        this.startX = curX;
        this.startY = curY;
    };
    ImagePreview.prototype.handleZoom = function (e) {
        if (!this.isZooming) {
            this.curStartPoint1 = {
                x: this.curPoint1.x,
                y: this.curPoint1.y
            };
            this.curStartPoint2 = {
                x: this.curPoint2.x,
                y: this.curPoint2.y
            };
        }
        this.isZooming = true;
        this.isAnimating = true;
        var curItem = this.imgItems[this.curIndex];
        if (curItem.dataset.loaded == 'false') {
            // 除了切屏之外对于加载错误的图片一律禁止其他操作
            this.isAnimating = false;
            return;
        }
        if (curItem.dataset.isEnlargement !== 'enlargement') {
            // 以下为旋转之后缩放时需要用到的参数
            var curItemViewTop = curItem.getBoundingClientRect().top; //当前元素距离视口的top
            var curItemViewLeft = curItem.getBoundingClientRect().left; //当前元素距离视口的left
            curItem.dataset.viewTopInitial = curItemViewTop.toString();
            curItem.dataset.viewLeftInitial = curItemViewLeft.toString();
        }
        var curItemWidth = curItem.getBoundingClientRect().width;
        var curItemHeihgt = curItem.getBoundingClientRect().height;
        var distaceBefore = Math.sqrt(Math.pow(this.curPoint1.x - this.curPoint2.x, 2) + Math.pow(this.curPoint1.y - this.curPoint2.y, 2));
        var distanceNow = Math.sqrt(Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2));
        var top = Number(curItem.dataset.top) || 0;
        var left = Number(curItem.dataset.left) || 0;
        var centerX = (this.curStartPoint1.x + this.curStartPoint2.x) / 2 - left;
        var centerY = (this.curStartPoint1.y + this.curStartPoint2.y) / 2 - top;
        this.curPoint1.x = e.touches[0].clientX;
        this.curPoint1.y = e.touches[0].clientY;
        this.curPoint2.x = e.touches[1].clientX;
        this.curPoint2.y = e.touches[1].clientY;
        var rotateDeg = Number(curItem.dataset.rotateDeg || '0');
        /**
         * 踩坑记：
         * 因为双指所确定的中心坐标 其参考起点始终是
         * 相对于视口的，那么在图片不断放大之后 其所确定的中心坐标必然会较实际有所误差
         * 所以这里在  放大的时候 同时需要在xy坐标加上其实际已经偏移的距离
         * 因为放大之后偏移值必为负值，所以要减 负负得正嘛
         */
        if (distaceBefore > distanceNow) { //缩小
            var centerX_4 = (this.curStartPoint1.x + this.curStartPoint2.x) / 2 - left;
            var centerY_4 = (this.curStartPoint1.y + this.curStartPoint2.y) / 2 - top;
            curItem.dataset.top = (top + (this.zoomScale) * centerY_4).toString();
            curItem.dataset.left = (left + (this.zoomScale) * centerX_4).toString();
            var width = curItemWidth * (1 - this.zoomScale);
            var height = curItemHeihgt * (1 - this.zoomScale);
            switch (Math.abs(rotateDeg % 360)) {
                case 0:
                case 180:
                    if (width <= Number(curItem.dataset.initialWidth)) {
                        width = Number(curItem.dataset.initialWidth);
                        height = Number(curItem.dataset.initialHeight);
                        curItem.dataset.top = curItem.dataset.initialTop;
                        curItem.dataset.left = curItem.dataset.initialLeft;
                        curItem.dataset.isEnlargement = 'shrink';
                    }
                    break;
                case 90:
                case 270:
                    if (height <= Number(curItem.dataset.initialWidth)) {
                        width = Number(curItem.dataset.initialHeight);
                        height = Number(curItem.dataset.initialWidth);
                        curItem.dataset.top = curItem.dataset.initialTop;
                        curItem.dataset.left = curItem.dataset.initialLeft;
                        curItem.dataset.isEnlargement = 'shrink';
                    }
                    break;
            }
            /**
             * 采坑记：
             * 旋转 90 270 这些体位的时候 ，width和height得交换下位置
             * 下同
             */
            switch (Math.abs(rotateDeg % 360)) {
                case 0:
                case 180:
                    curItem.style.cssText = "\n                            transform: rotateZ(" + rotateDeg + "deg); \n                            width: " + width + "px;\n                            height: " + height + "px;\n                            top: " + curItem.dataset.top + "px;\n                            left: " + curItem.dataset.left + "px;\n                    ";
                    break;
                case 90:
                case 270:
                    curItem.style.cssText = "\n                            transform: rotateZ(" + rotateDeg + "deg); \n                            height: " + width + "px;\n                            width: " + height + "px;\n                            left: " + curItem.dataset.left + "px;\n                            top: " + curItem.dataset.top + "px;\n                    ";
                    break;
                default:
                    break;
            }
        }
        else if (distaceBefore < distanceNow) { //放大
            curItem.dataset.isEnlargement = 'enlargement';
            curItem.dataset.top = (top - (this.zoomScale) * centerY).toString();
            curItem.dataset.left = (left - (this.zoomScale) * centerX).toString();
            switch (Math.abs(rotateDeg % 360)) {
                case 0:
                case 180:
                    curItem.style.cssText += "\n                            width: " + curItemWidth * (1 + this.zoomScale) + "px;\n                            height: " + curItemHeihgt * (1 + this.zoomScale) + "px;\n                            top: " + curItem.dataset.top + "px;\n                            left: " + curItem.dataset.left + "px;\n                    ";
                    break;
                case 90:
                case 270:
                    curItem.style.cssText += "\n                            height: " + curItemWidth * (1 + this.zoomScale) + "px;\n                            width: " + curItemHeihgt * (1 + this.zoomScale) + "px;\n                            left: " + curItem.dataset.left + "px;\n                            top: " + curItem.dataset.top + "px;\n                    ";
                    break;
                default:
                    break;
            }
        }
        this.isAnimating = false;
    };
    ImagePreview.prototype.handleToucnEnd = function (e) {
        e.preventDefault();
        this.movePoints = []; //重置收集手指移动时要收集得点
        //动画正在进行时，或者不是单指操作时,或者根本没有产生位移，一律不处理
        if (this.isAnimating || e.changedTouches.length !== 1 || this.isMotionless) {
            return;
        }
        var type = (e.target).dataset.type;
        if (this.operateMaps[type]) {
            return;
        }
        if (e.touches.length == 0) {
            // someOperate;
            this.isZooming = false;
        }
        var curItem = this.imgItems[this.curIndex];
        this.isMotionless = true;
        this.isEnlargeMove = false;
        var isBoundary = curItem.dataset.toLeft == 'true' || curItem.dataset.toRight == 'true';
        if (curItem.dataset.isEnlargement == 'enlargement') {
            // 放大的时候,如果到达边界还是进行正常的切屏操作
            // for long-img operate it solely
            if (isBoundary) {
                // 重置是否已到达边界的变量,如果容器内能容纳图片则不需要重置
                var imgContainerRect = this.imgContainer.getBoundingClientRect();
                var conWidth = imgContainerRect.width;
                var curItemViewLeft = curItem.getBoundingClientRect().left;
                var curItemViewRight = curItem.getBoundingClientRect().right;
                if (curItemViewLeft < 0 || curItemViewRight > conWidth) {
                    curItem.dataset.toLeft = 'false';
                    curItem.dataset.toRight = 'false';
                    this.handleTEndEnNormal(e);
                }
                else {
                    if (this.fingerDirection == 'vertical') {
                        this.handleTEndEnlarge(e);
                    }
                    else if (this.fingerDirection == 'horizontal') {
                        this.handleTEndEnNormal(e);
                    }
                }
            }
            else {
                this.handleTEndEnlarge(e);
            }
        }
        else {
            //正常情况下的
            this.handleTEndEnNormal(e);
        }
        this.fingerDirection = '';
    };
    ImagePreview.prototype.handleTEndEnlarge = function (e) {
        var imgContainerRect = this.imgContainer.getBoundingClientRect();
        var conWidth = imgContainerRect.width;
        var conHeight = imgContainerRect.height;
        var curItem = this.imgItems[this.curIndex];
        var curImg = curItem.querySelector('img');
        var curItemWidth = curItem.getBoundingClientRect().width;
        var curItemHeihgt = curItem.getBoundingClientRect().height;
        var curItemViewLeft = curItem.getBoundingClientRect().left;
        var curItemViewRight = curItem.getBoundingClientRect().right;
        /**
         * 旋转后会产生偏移值
         */
        var offsetX = 0;
        var offsetY = 0;
        var rotateDeg = Number(curItem.dataset.rotateDeg || '0');
        switch (Math.abs(rotateDeg % 360)) {
            case 90:
            case 270:
                /**
                 * 以x轴为例子
                 * curItemWidth / 2,为中心点的坐标，
                 * curitemHeight / 2,是顶部距离中心点的坐标
                 * 二者的差值即为x轴的偏移
                 */
                offsetX = (curItemWidth - curItemHeihgt) / 2;
                offsetY = (curItemHeihgt - curItemWidth) / 2;
                break;
            default:
                break;
        }
        var maxTop = offsetY;
        var minTop = conHeight - curItemHeihgt + offsetY;
        var maxLeft = offsetX;
        var minLeft = conWidth - curItemWidth + offsetX;
        var curItemTop = Number(curItem.dataset.top);
        var curItemLeft = Number(curItem.dataset.left);
        /**
         * 1s 60 次
         * 我需要在0.3s 完成这项操作
         *
         */
        var recoverY = false;
        var recoverX = false;
        var vy;
        var stepY;
        var vx;
        var stepX;
        var startX;
        var endX;
        var startY;
        var endY;
        if (curItemLeft > maxLeft) {
            stepX = this.computeStep(curItemLeft - maxLeft, this.slideTime);
            startX = curItemLeft;
            endX = maxLeft;
            recoverX = true;
        }
        else if (curItemLeft < minLeft) {
            stepX = this.computeStep(curItemLeft - minLeft, this.slideTime);
            startX = curItemLeft;
            endX = minLeft;
            recoverX = true;
        }
        if (curItemTop > maxTop) {
            stepY = this.computeStep((curItemTop - maxTop), this.slideTime);
            startY = curItemTop;
            endY = maxTop;
            recoverY = true;
        }
        else if (curItemTop < minTop) {
            stepY = this.computeStep((curItemTop - minTop), this.slideTime);
            startY = curItemTop;
            endY = minTop;
            recoverY = true;
        }
        // 如果容器内能完整展示图片就不需要移动至边界
        if (curItemViewLeft >= 0 && curItemViewRight <= conWidth) {
            recoverX = false;
            curItem.dataset.toLeft = 'true';
            curItem.dataset.toRight = 'true';
        }
        if (curItemHeihgt <= conHeight) {
            recoverY = false;
            curItem.dataset.toTop = 'true';
            curItem.dataset.toBottom = 'true';
        }
        if (recoverX && recoverY) {
            this.animateMultiValue(curItem, [
                {
                    prop: 'left',
                    start: startX,
                    end: endX,
                    step: -stepX
                }, {
                    prop: 'top',
                    start: startY,
                    end: endY,
                    step: -stepY
                }
            ]);
            curItem.dataset.left = "" + endX;
            curItem.dataset.top = "" + endY;
            if (endX == maxLeft) {
                //toLeft 即为到达左边界的意思下同
                curItem.dataset.toLeft = 'true';
                curItem.dataset.toRight = 'false';
            }
            else if (endX == minLeft) {
                curItem.dataset.toLeft = 'false';
                curItem.dataset.toRight = 'true';
            }
            if (endY == maxTop) {
                curItem.dataset.toTop = 'true';
                curItem.dataset.toBottom = 'false';
            }
            else if (endY == minTop) {
                curItem.dataset.toTop = 'false';
                curItem.dataset.toBottom = 'true';
            }
        }
        else if (recoverX) {
            this.animate(curItem, 'left', startX, endX, -stepX);
            curItem.dataset.left = "" + endX;
            if (endX == maxLeft) {
                //toLeft 即为到达左边界的意思下同
                curItem.dataset.toLeft = 'true';
                curItem.dataset.toRight = 'false';
            }
            else if (endX == minLeft) {
                curItem.dataset.toLeft = 'false';
                curItem.dataset.toRight = 'true';
            }
        }
        else if (recoverY) {
            this.animate(curItem, 'top', startY, endY, -stepY);
            curItem.dataset.top = "" + endY;
            if (endY == maxTop) {
                curItem.dataset.toTop = 'true';
                curItem.dataset.toBottom = 'false';
            }
            else if (endY == minTop) {
                curItem.dataset.toTop = 'false';
                curItem.dataset.toBottom = 'true';
            }
        }
        else {
            // 如果容器内能完整展示图片就不需要移动至边界
            if (curItemViewLeft >= 0 && curItemViewRight <= conWidth) {
                curItem.dataset.toLeft = 'true';
                curItem.dataset.toRight = 'true';
            }
            else {
                curItem.dataset.toLeft = 'false';
                curItem.dataset.toRight = 'false';
            }
            curItem.dataset.toTop = 'false';
            curItem.dataset.toBottom = 'false';
        }
    };
    ImagePreview.prototype.handleTEndEnNormal = function (e) {
        var endX = Math.round(e.changedTouches[0].clientX);
        if (endX - this.touchStartX >= this.threshold) { //前一张
            if (this.curIndex == 0) { //第一张
                this.slideSelf();
                return;
            }
            this.curIndex--;
            this.slidePrev();
        }
        else if (endX - this.touchStartX <= -this.threshold) { //后一张
            if (this.curIndex + 1 == this.imgsNumber) { //最后一张
                this.slideSelf();
                return;
            }
            this.curIndex++;
            this.slideNext();
        }
        else { //复原
            this.slideSelf();
        }
    };
    ImagePreview.prototype.slideNext = function () {
        var endX = -(this.curIndex * this.screenWidth);
        if (endX < -(this.screenWidth * this.imgsNumber - 1)) {
            endX = -(this.screenWidth * this.imgsNumber - 1);
            this.curIndex = this.imgsNumber - 1;
        }
        var step = this.computeStep(Math.abs(endX - this.imgContainerMoveX), this.slideTime);
        this.animate(this.imgContainer, 'transform', this.imgContainerMoveX, endX, -step);
    };
    ImagePreview.prototype.slidePrev = function () {
        var endX = -(this.curIndex * this.screenWidth);
        if (endX > 0) {
            endX = 0;
            this.curIndex = 0;
        }
        var step = this.computeStep(Math.abs(endX - this.imgContainerMoveX), this.slideTime);
        this.animate(this.imgContainer, 'transform', this.imgContainerMoveX, endX, step);
    };
    ImagePreview.prototype.slideSelf = function () {
        var endX = -(this.curIndex * this.screenWidth);
        if (endX < this.imgContainerMoveX) {
            var step = this.computeStep(Math.abs(endX - this.imgContainerMoveX), this.slideTime);
            this.animate(this.imgContainer, 'transform', this.imgContainerMoveX, endX, -step);
        }
        else {
            var step = this.computeStep(Math.abs(endX - this.imgContainerMoveX), this.slideTime);
            this.animate(this.imgContainer, 'transform', this.imgContainerMoveX, endX, step);
        }
    };
    ImagePreview.prototype.animate = function (el, prop, start, end, step) {
        var _this = this;
        if (this.isAnimating) {
            return;
        }
        this.isAnimating = true;
        if (Math.abs(end - start) < Math.abs(step)) {
            step = end - start;
        }
        function processStyle() {
            switch (prop) {
                case 'transform':
                    el.style.left = " " + (start + step) + "px";
                    ;
                    break;
                case 'top':
                    el.style.top = start + step + "px";
                    break;
                case 'left':
                    el.style.left = start + step + "px";
                    break;
                default:
                    break;
            }
        }
        processStyle();
        start += step;
        var move = function () {
            if (Math.abs(end - start) < Math.abs(step)) {
                step = end - start;
            }
            processStyle();
            start += step;
            if (start !== end) {
                requestAnimationFrame(move);
            }
            else {
                if (prop == 'transform') {
                    _this.imgContainerMoveX = end;
                }
                _this.isAnimating = false;
            }
        };
        if (start !== end) {
            requestAnimationFrame(move);
        }
        else {
            if (prop == 'transform') {
                this.imgContainerMoveX = end;
            }
            this.isAnimating = false;
        }
    };
    ImagePreview.prototype.animateMultiValue = function (el, options) {
        var _this = this;
        if (this.isAnimating) {
            return;
        }
        this.isAnimating = true;
        for (var i = 0, L = options.length; i < L; i++) {
            var item = options[i];
        }
        var processStyle = function () {
            var isFullFilled = true;
            for (var i = 0, L = options.length; i < L; i++) {
                var item = options[i];
                if (Math.abs(item.start - item.end) < Math.abs(item.step)) {
                    item.step = item.end - item.start;
                }
                item.start += item.step;
                el.style[item.prop] = item.start + "px";
                if (item.start !== item.end) {
                    isFullFilled = false;
                }
            }
            if (isFullFilled) {
                _this.isAnimating = false;
            }
            else {
                requestAnimationFrame(processStyle);
            }
        };
        processStyle();
    };
    ImagePreview.prototype.computeStep = function (displacement, time) {
        var v = displacement / time;
        var frequency = 1000 / 60;
        return v * frequency;
    };
    ImagePreview.prototype.genFrame = function () {
        var _this = this;
        var curImg = this.options.curImg;
        var images = this.options.imgs;
        if (!images || !images.length) {
            console.error("没图，玩你麻痹");
            return;
        }
        this.imgsNumber = images.length;
        var index = images.indexOf(curImg);
        var imagesHtml = '';
        if (index == -1) {
            index = 0;
        }
        this.curIndex = index;
        this.imgContainerMoveX = -(index * this.screenWidth);
        images.forEach(function (src) {
            imagesHtml += "\n            <div class=\"" + _this.prefix + "itemWraper\">\n                <div class=\"" + _this.prefix + "item\">\n                    <img src=\"" + src + "\">\n                </div>\n            </div>\n            ";
        });
        var html = "\n                <div class=\"" + this.prefix + "close\">\n                    <svg t=\"1563161688682\" class=\"icon\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" p-id=\"5430\">\n                        <path d=\"M10.750656 1013.12136c-13.822272-13.822272-13.822272-36.347457 0-50.169729l952.200975-952.200975c13.822272-13.822272 36.347457-13.822272 50.169729 0 13.822272 13.822272 13.822272 36.347457 0 50.169729l-952.200975 952.200975c-14.334208 14.334208-36.347457 14.334208-50.169729 0z\" fill=\"#ffffff\" p-id=\"5431\"></path><path d=\"M10.750656 10.750656c13.822272-13.822272 36.347457-13.822272 50.169729 0L1013.633296 963.463567c13.822272 13.822272 13.822272 36.347457 0 50.169729-13.822272 13.822272-36.347457 13.822272-50.169729 0L10.750656 60.920385c-14.334208-14.334208-14.334208-36.347457 0-50.169729z\" fill=\"#ffffff\" p-id=\"5432\">\n                        </path>\n                    </svg>\n                </div>\n                <div class=\"" + this.prefix + "imgContainer\">\n                    " + imagesHtml + "\n                </div>\n                <div class=\"" + this.prefix + "bottom\">\n                    <div class=\"" + this.prefix + "item \">\n                        <svg data-type=\"rotateLeft\" t=\"1563884004339\" class=\"icon\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" p-id=\"1099\" width=\"200\" height=\"200\"><path d=\"M520.533333 285.866667c140.8 12.8 251.733333 132.266667 251.733334 277.333333 0 153.6-123.733333 277.333333-277.333334 277.333333-98.133333 0-192-55.466667-238.933333-140.8-4.266667-8.533333-4.266667-21.333333 8.533333-29.866666 8.533333-4.266667 21.333333-4.266667 29.866667 8.533333 42.666667 72.533333 119.466667 119.466667 204.8 119.466667 128 0 234.666667-106.666667 234.666667-234.666667s-98.133333-230.4-226.133334-234.666667l64 102.4c4.266667 8.533333 4.266667 21.333333-8.533333 29.866667-8.533333 4.266667-21.333333 4.266667-29.866667-8.533333l-89.6-145.066667c-4.266667-8.533333-4.266667-21.333333 8.533334-29.866667L597.333333 187.733333c8.533333-4.266667 21.333333-4.266667 29.866667 8.533334 4.266667 8.533333 4.266667 21.333333-8.533333 29.866666l-98.133334 59.733334z\" p-id=\"1100\" fill=\"#ffffff\"></path></svg>\n                    </div>\n                    <div class=\"" + this.prefix + "item\">\n                        <svg data-type=\"rotateRight\" t=\"1563884064737\" class=\"icon\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" p-id=\"1251\" width=\"200\" height=\"200\"><path d=\"M503.466667 285.866667L405.333333 226.133333c-8.533333-8.533333-12.8-21.333333-8.533333-29.866666 8.533333-8.533333 21.333333-12.8 29.866667-8.533334l145.066666 89.6c8.533333 4.266667 12.8 17.066667 8.533334 29.866667l-89.6 145.066667c-4.266667 8.533333-17.066667 12.8-29.866667 8.533333-8.533333-4.266667-12.8-17.066667-8.533333-29.866667l64-102.4c-123.733333 4.266667-226.133333 106.666667-226.133334 234.666667s106.666667 234.666667 234.666667 234.666667c85.333333 0 162.133333-46.933333 204.8-119.466667 4.266667-8.533333 17.066667-12.8 29.866667-8.533333 8.533333 4.266667 12.8 17.066667 8.533333 29.866666-51.2 85.333333-140.8 140.8-238.933333 140.8-153.6 0-277.333333-123.733333-277.333334-277.333333 0-145.066667 110.933333-264.533333 251.733334-277.333333z\" p-id=\"1252\" fill=\"#ffffff\"></path></svg>\n                    </div>\n                </div>\n        ";
        var style = "\n            ." + this.prefix + "imagePreviewer{\n                position: fixed;\n                top:0;\n                left: 100%;\n                width: 100%;\n                height: 100%;\n                background: rgba(0,0,0,1);\n                color:#fff;\n                transform: translate3d(0,0,0);\n                transition: left 0.5s;\n                overflow:hidden;\n                user-select: none;\n            }\n            ." + this.prefix + "imagePreviewer." + this.defToggleClass + "{\n                left: 0%;\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "close{\n                position: absolute;\n                top: 20px;\n                right: 20px;\n                z-index: 1;\n                box-sizing: border-box;\n                width: 22px;\n                height: 22px;\n                cursor:pointer;\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "close svg{\n                width: 100%;\n                height: 100%;             \n            }\n            ." + this.prefix + "imagePreviewer svg{\n                overflow:visible;\n            }\n            ." + this.prefix + "imagePreviewer svg path{\n                stroke: #948888;\n                stroke-width: 30px;\n            }\n            \n            ." + this.prefix + "imagePreviewer " + this.prefix + ".close." + this.prefix + "scroll{\n                height: 0;\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "imgContainer{\n                position: relative;\n                transform: translateX( " + this.imgContainerMoveX + "px );\n                height: 100%;\n                font-size: 0;\n                white-space: nowrap;\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "itemWraper{\n                box-sizing:border-box;\n                position: relative;\n                display:inline-block;\n                width: 100%;\n                height: 100%;\n                overflow:hidden;\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "imgContainer ." + this.prefix + "item{\n                box-sizing:border-box;\n                position: absolute;\n                width: 100%;\n                height: auto;\n                font-size: 0;\n                white-space: normal;\n                transition: transform 0.5s;\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "item img{\n                width: 100%;\n                height: auto;\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "bottom{\n                position: absolute;\n                bottom: 0;\n                left: 20px;\n                right: 20px;\n                padding:10px;\n                text-align: center;\n                border-top: 1px solid rgba(255, 255, 255, .2);\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "bottom ." + this.prefix + "item{\n                display:inline-block;\n                width: 22px;\n                height: 22px;\n                margin-right: 10px;\n                cursor:pointer;\n            }\n            ." + this.prefix + "imagePreviewer ." + this.prefix + "bottom ." + this.prefix + "item svg{\n                width: 100%;\n                height: 100%;\n            }\n        ";
        this.ref = document.createElement('div');
        this.ref.className = this.prefix + "imagePreviewer";
        this.ref.innerHTML = html;
        if (!document.querySelector("#" + this.prefix + "style")) {
            var styleElem = document.createElement('style');
            styleElem.id = this.prefix + "style";
            styleElem.innerHTML = style;
            document.querySelector('head').appendChild(styleElem);
        }
        document.body.appendChild(this.ref);
    };
    ImagePreview.prototype.handleReausetAnimate = function () {
        if (!window['requestAnimationFrame']) {
            window['requestAnimationFrame'] = (function () {
                return window['webkitRequestAnimationFrame'] ||
                    function (callback) {
                        window.setTimeout(callback, 1000 / 60);
                        return 0;
                    };
            })();
        }
    };
    ImagePreview.prototype.close = function (e) {
        e.stopImmediatePropagation();
        clearTimeout(this.performerClick);
        this.toggleClass(this.ref, this.defToggleClass);
    };
    ImagePreview.prototype.show = function (index) {
        this.curIndex = index;
        this.imgContainerMoveX = -index * this.screenWidth;
        this.imgContainer.style.left = this.imgContainerMoveX + "px";
        this.toggleClass(this.ref, this.defToggleClass);
    };
    ImagePreview.prototype.toggleClass = function (ref, className) {
        var classes = ref.className.split(' ');
        var index = classes.indexOf(className);
        if (index !== -1) {
            classes.splice(index, 1);
        }
        else {
            classes.push(className);
        }
        ref.className = classes.join(' ');
    };
    ImagePreview.prototype.getMovePoints = function (e) {
        this.movePoints.push({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        });
    };
    ImagePreview.prototype.destroy = function () {
        this.ref.parentNode.removeChild(this.ref);
    };
    return ImagePreview;
}());
