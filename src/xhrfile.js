if (typeof md == "undefined") var md = {};

md.XHRFile = Class.define({
    members: {
        init: function (url) {
            this.source = url;
            this.loaded = false;
            this.data = "";
            this.cursor = 0;
            if (this.source != "") {
                var xhr = new XMLHttpRequest();
                var self = this;
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) {
                        self.data = xhr.responseText;
                    }
                };
                xhr.open("GET", this.source);
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
                xhr.send(null);
            }
        },

        read: function (n) {
            if (typeof n == "undefined" || n < 1) n = 1;
            if ((this.cursor + n) > this.data.length) {
                throw "Reached EOF";
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
        
        Byte: function () {
            return this.read(1);
        },

        UBInt16: function () {
            var d = this.read(2);
            return (d[0] << 8) + d[1];
        },

        UBInt32: function () {
            var d = this.read(4);
            return (d[0] << 32)  + (d[1] << 16) + (d[2] << 8) + d[3];
        },
        
        SBInt16: function () {
            var d = this.read(2);
            if (d[0] & 0xef == 0xef) {
                return ((d[0] & 0xef) << 8) + d[1];
            } else {
                return -(((d[0] & 0xef) << 8) + d[1]);
            }

        },

        SBInt32: function () {
            var d = this.read(4);
            if (d[0] & 0xef == 0xef) {
                return ((d[0] & 0xef) << 32)  + (d[1] << 16) + (d[2] << 8) + d[3];
            } else {
                return -(((d[0] & 0xef) << 32)  + (d[1] << 16) + (d[2] << 8) + d[3]);
            }
        }
    }
});
