if (typeof md == "undefined") var md = {};

md.SEEK_CUR = 0;
md.SEEK_SET = 1;

md.XHRFile = Class.define({
    members: {
        init: function (url) {
            this.source = url;
            this.loaded = false;
            this.data = "";
            this.cursor = 0;
            if (this.source != "") {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", this.source, false);
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
                xhr.send(null);
                this.data = xhr.responseText;
            }
        },

        read: function (n) {
            if (typeof n == "undefined" || n < 1) n = 1;
            if ((this.cursor + n) > this.data.length) {
                throw "Error: Reached EOF";
            }
            var o = [];
            var cur = this.cursor;
            var last = cur + n;
            for (; cur < last; cur++) {
                o.push(this.data.charCodeAt(cur) % 256);
            }
            this.cursor = cur;
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

        String: function (n) {
            var data = this.read(n);
            var s = "";
            for (var i = 0; i < n; i++) s += String.fromCharCode(data[i]);
            return s;
        },
        
        Byte: function () {
            return this.read(1);
        },

        UBInt16: function () {
            var d = this.read(2);
            return (d[0] << 8) + d[1];
        },

        UBInt32: function () {
            var d = this.read(4);
            return (d[0] << 24)  + (d[1] << 16) + (d[2] << 8) + d[3];
        },

        SBInt32: function () {
            var d = this.read(4);
            return (d[0] << 24)  + (d[1] << 16) + (d[2] << 8) + d[3];
        },
        
        SBInt16: function () {
            var d = this.UBInt16();
            if ((d & 0x8000) == 0x8000) {
                return d | 0xffff0000;
            } else {
                return d;
            }
        },

        Fixed32: function () {
            /* actually returns a float, however, since JS floats are 64 bit, they might have enough percision in them */
            var r = this.SBInt16();
            var l = this.UBInt16();
            return r + l / 65536.0;
        }
    }
});
