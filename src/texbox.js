if (typeof md == "undefined") var md = {};

md.Node = Class.define({
    type: "Node",

    members: {
        init: function () {
        },

        get_kerning: function (next) {
            return 0;
        },
        
        render: function (ctx, x, y) {
        }
    }
});

md.Box = Class.define({
    type: "Box",
    superclass: md.Node,
    members:{
        init: function (width, height, depth) {
            this._super();
            this.width = width;
            this.height = height;
            this.depth = depth;
        },

        render: function (ctx, x, y) {
            ctx.save();
            ctx.fillRect(x, y - this.height, this.width, this.height + this.depth);
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + this.width, y);
            ctx.stroke();
            ctx.restore();
        }
    }
});

md.List = Class.define({
    type: "List",
    superclass: md.Box,
    members: {
        init: function (elements) {
            this._super(0, 0, 0);
            this.children = elements;
        }
    }
});

md.HList = Class.define({
    type: "HList",
    superclass: md.List,
    members: {
        init: function (elements) {
            this._super(elements);
            this.hpack();
        },

        hpack: function () {
            var i;
            var x = 0, d = 0, h = 0;
            var p;
            for (i = 0; i < this.children.length; i++) {
                p = this.children[i];
                x += p.width;
                h = Math.max(h, p.height);
                d = Math.max(d, p.depth);
            }
            this.height = h;
            this.depth = d;
            this.width = x;
        },

        render: function (ctx, x, y) {
            var i;
            var p;
            ctx.save();
            var px = x;
            for (i = 0; i < this.children.length; i++) {
                p = this.children[i];
                p.render(ctx, px, y);
                px += p.width;
            }
            ctx.strokeStyle = "blue";
            ctx.strokeRect(x, y - this.height, this.width, this.height + this.depth);
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + this.width, y);
            ctx.stroke();
            ctx.restore();
        }
    }
});
