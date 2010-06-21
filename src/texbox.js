if (typeof md == "undefined") var md = {};

md.clone = function (o) {
    // shallow clone, just copies properties
    var oo;
    var c;
    if (typeof o == "number" || typeof o == "string") {
        return o;
    }
    if (o instanceof Object) {
        oo = {};
        for (var key in o) {
            c = this.clone(o[key]);
            if (c !== undefined) oo[key] = c;
        }
        return oo;
    }
    if (o instanceof Array) {
        oo = [];
        for (var i; i < o.length; i) {
            c = this.clone(o[i]);
            if (c !== undefined) oo[i] = c;
        }
        return oo;
    }
};

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

md.Glue = Class.define({
    type: "Glue",
    superclass: md.Node,
    members: {
        init: function (glue_spec) {
            this._super();
            this.glue_spec = md.clone(glue_spec);
        }
    }
});

md.GlueSpec = Class.define({
    type: "GlueSpec",
    members: {
        init: function (width, stretch, stretch_order, shrink, shrink_order) {
           this.width = width;
           this.stretch = stretch;
           this.stretch_order = stretch_order;
           this.shrink = shrink;
           this.shrink_order = shrink_order;
        }
    }
});

md.Fil = Class.define({
    type: "Glue:Fil",
    superclass: md.Glue,
    members: {
        init: function () {
            this._super(new md.GlueSpec(0., 1., 1, 0., 0));
        }
    }
});

md.Fill = Class.define({
    type: "Glue:Fill",
    superclass: md.Glue,
    members: {
        init: function () {
            this._super(new md.GlueSpec(0., 1., 2, 0., 0));
        }
    }
});

md.Filll = Class.define({
    type: "Glue:Filll",
    superclass: md.Glue,
    members: {
        init: function () {
            this._super(new md.GlueSpec(0., 1., 3, 0., 0));
        }
    }
});

md.NegFil = Class.define({
    type: "Glue:NegFil",
    superclass: md.Glue,
    members: {
        init: function () {
            this._super(new md.GlueSpec(0., 0., 0, 1., 1));
        }
    }
});

md.NegFill = Class.define({
    type: "Glue:NegFill",
    superclass: md.Glue,
    members: {
        init: function () {
            this._super(new md.GlueSpec(0., 0., 0, 1., 2));
        }
    }
});

md.NegFilll = Class.define({
    type: "Glue:NegFilll",
    superclass: md.Glue,
    members: {
        init: function () {
            this._super(new md.GlueSpec(0., 0., 0, 1., 3));
        }
    }
});

md.SsGlue = Class.define({
    type: "Glue:SsGlue",
    superclass: md.Glue,
    members: {
        init: function () {
            this._super(new md.GlueSpec(0., 1., 1, -1., 1));
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
