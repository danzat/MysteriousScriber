if (typeof md == "undefined") var md = {};

md.SEEK_CUR = 0;
md.SEEK_SET = 1;

md.Stream = Class.define({
    type: "Stream",
    members: {
        init: function (data) {
            this.data = (typeof data == "undefine") ? "" : data;
            this.cursor = 0;
        },

        length: function () {
            return this.data.length;
        },

        copy: function (from, length) {
            return new md.Stream(this.data.substr(from, length));
        },

        /*
         * Read <n> bytes at the current position in the stream and advance the
         * cursor by the same amount.
         * If the <offset> parameter is specified, read <n> number of bytes at
         * <offset> bytes from the beginning of the stream, but do not change
         * the current cursor position.
         */
        read: function (n, offset) {
            if (typeof n == "undefined" || n < 1) n = 1;
            if ((this.cursor + n) > this.data.length) {
                throw "Error: Reached EOF";
            }
            var o = [];
            var cur = (typeof offset == "undefined") ? this.cursor : offset;
            var last = cur + n;
            for (; cur < last; cur++) {
                o.push(this.data.charCodeAt(cur) % 256);
            }
            if (typeof offset == "undefined") this.cursor = cur;
            return o;
        },

        seek: function (loc, mode) {
            loc = (typeof loc == "undefined") ? 0 : loc;
            mode = (typeof mode == "undefined") ? md.SEEK_CUR : mode;
            if (mode == md.SEEK_CUR) {
                this.cursor += loc;
            } else if (mode == md.SEEK_SET) {
                this.cursor = loc;
            } else {
                throw "Error: Undefined seek mode: " + mode;
            }
        },

        String: function (n, offset) {
            var data = this.read(n, offset);
            var s = "";
            for (var i = 0; i < n; i++) s += String.fromCharCode(data[i]);
            return s;
        },
        
        Byte: function (offset) {
            return this.read(1, offset)[0];
        },

        UBInt16: function (offset) {
            var d = this.read(2, offset);
            return (d[0] << 8) + d[1];
        },

        UBInt32: function (offset) {
            var d = this.read(4, offset);
            return (d[0] << 24)  + (d[1] << 16) + (d[2] << 8) + d[3];
        },

        SBInt32: function (offset) {
            var d = this.read(4, offset);
            return (d[0] << 24)  + (d[1] << 16) + (d[2] << 8) + d[3];
        },
        
        SBInt16: function (offset) {
            var d = this.UBInt16(offset);
            if ((d & 0x8000) == 0x8000) {
                return d | 0xffff0000;
            } else {
                return d;
            }
        },

        Fixed32: function (offset) {
            /* actually returns a float, however, since JS floats are 64 bit, they might have enough percision in them */
            var r, l;
            if (typeof offset == "undefined") {
                r = this.SBInt16();
                l = this.UBInt16();
            } else {
                r = this.SBInt16(offset);
                l = this.UBInt16(offset + 2);
            }
            return r + l / 65536.0;
        }
    }
});

md.XHRFile = Class.define({
    type: "XHRFile",
    superclass: md.Stream,
    members: {
        init: function (url) {
            this.source = url;
            if (this.source != "") {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", this.source, false);
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
                xhr.send(null);
                this._super(xhr.responseText);
            } else {
                this._super();
            }
        }
    }
});
