module.exports = (function() {
    $$.component("mg-content", {
        template: "<div class='scroll_body'><slot></slot></div>",
        ready: function() {
            var $el = $(this.$el), $scroll, childs, scope,
                handle, refresh, opt = {}, repos;   // 定义操作对象

            scope = $$.getVm(this);

            refresh = $el.attr("refresh")   // 默认开启自动刷新
            opt.refresh = refresh || "once";
            opt.pullRefreshDown = scope[$el.attr("pullRefreshDown")] || null;
            opt.pullRefreshUp   = scope[$el.attr("pullRefreshUp")]   || null;

            $scroll = $el.addClass("scroll content").scroll(opt); // 初始化

            childs = $el.parent()[0].children;
            for(var i=0; i<childs.length; i++) {
                var tag  = childs[i].tagName.toLowerCase(),
                    test = "mg-footer mg-tabs";

                // 非 native 环境检测到 header 才加 class
                if (tag == "mg-header") {
                    $el.addClass("has-header");
                } else if (test.match(new RegExp("^"+tag))) {
                    $el.addClass("has-footer");
                }
            }

            handle = $el.attr("ctrl");
            if (handle && scope[handle] !== undefined) {
                scope[handle] = $scroll;
            }

            // 是否监控数据自动刷新内容
            repos = $el.attr("repos");
            if (scope[refresh] != undefined) {
                scope.$watch(refresh, function(newVal) {
                    Vue.nextTick(function() {
                        $scroll.refresh();
                        if (repos) $scroll.scrollTo(0, 0);
                    })

                    $el.once("touchstart", function() {
                        $scroll.refresh();
                        if (repos) $scroll.scrollTo(0, 0);
                    })
                })
            }

            $el.removeAttr("ctrl repos refresh scrollbar pullRefreshDown pullRefreshUp");
        }
    });

    $$.component("mg-scroll", {
        template: "<div><slot></slot></div>",
        ready: function() {
            var $el = $(this.$el), $scroll, handle,
                refresh, repos, opt = {}, scope;   // 定义操作对象

            scope = $$.getVm(this);

            refresh = $el.attr("refresh");
            opt.refresh = refresh || "once";
            opt.scrollbars = $el.attr("scrollbar") == "false" ? false : true;
            opt.pullRefreshDown = scope[$el.attr("pullRefreshDown")] || null;
            opt.pullRefreshUp   = scope[$el.attr("pullRefreshUp")]   || null;

            if ($el.attr("scroll-x")) {
                opt.scrollX = true;
                opt.scrollY = false;
                $el.children().addClass("scroll-x");
            }

            $scroll = $el.addClass("scroll").scroll(opt);

            handle = $el.attr("ctrl");
            if (handle && scope[handle] !== undefined) {
                scope[handle] = $scroll;
            }

            // 是否监控数据自动刷新内容
            repos = $el.attr("repos");
            if (scope[refresh] !== undefined) {
                scope.$watch(refresh, function() {
                    Vue.nextTick(function() {
                        $scroll.refresh();
                        if (repos) $scroll.scrollTo(0, 0);
                    })

                    $el.once("touchstart", function() {
                        $scroll.refresh();
                        if (repos) $scroll.scrollTo(0, 0);
                    })
                })
            }

            $el.removeAttr("ctrl repos refresh scrollbar pullRefreshDown pullRefreshUp scroll-x");
        }
    })
})();
