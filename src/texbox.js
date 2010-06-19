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
