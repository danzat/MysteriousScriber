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
        },

        determine_order: function (set) {
            for (var i = set.length - 1; i >= 0; i--) {
                if (set[i] != 0) return i;
            }
            return 0;
        },

        set_glue: function (d, sign, set) {
            this.glue_order = this.determine_order(set);
            this.glue_sign = sign;
            if (set[this.glue_order] != 0){
                this.glue_ratio = d / set[this.glue_order];
            } else /* set[this.glue_order] == 0 */{
                this.glue_sign = 0;
                this.glue_ratio = 0;
            }
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

        hpack: function (w) {
            w = (typeof w == "undefined") ? 0 : w;
            var i;
            var x = 0, d = 0, h = 0;
            var p;
            var glue_spec;
            var total_stretch = [0, 0, 0, 0];
            var total_shrink = [0, 0, 0, 0];
            for (i = 0; i < this.children.length; i++) {
                p = this.children[i];
                if (p instanceof md.Box || p instanceof md.List) {
                    x += p.width;
                    h = Math.max(h, p.height);
                    d = Math.max(d, p.depth);
                } else if (p instanceof md.Glue) {
                    glue_spec = p.glue_spec;
                    x += glue_spec.width;
                    total_stretch[glue_spec.stretch_order] += glue_spec.stretch;
                    total_shrink[glue_spec.shrink_order] += glue_spec.shrink;
                }
            }
            this.height = h;
            this.depth = d;
            w += x;
            this.width = w;
            x = w - x;

            if (x == 0) {
                this.glue_sign = 0;
                this.glue_order = 0;
                this.glue_ratio = 0;
            } else if (x > 0) {
                this.set_glue(x, 1, total_stretch);
            } else /* x < 0 */ {
                this.set_glue(x, -1, total_shrink);
            }
        },

        render: function (ctx, x, y) {
            var i;
            var p;
            ctx.save();
            var px = x;
            for (i = 0; i < this.children.length; i++) {
                p = this.children[i];
                if (p instanceof md.Box || p instanceof md.List) {
                    p.render(ctx, px, y);
                    px += p.width;
                } else if (p instanceof md.Glue) {
                    if (this.glue_sign == 1) {
                        if (p.glue_spec.stretch_order == this.glue_order) {
                            px += Math.round(p.glue_spec.stretch * this.glue_ratio);
                        }
                    } else if (this.glue_sign == -1) {
                        if (p.glue_spec.shrink_order == this.glue_order) {
                            px += Math.round(p.glue_spec.shrink * this.glue_ratio);
                        }
                    }
                }
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
