if (typeof md == "undefined") var md = {};

md.TTF = Class.define({
    members: {
        init: function (url) {
            this.url = url;
            var f = this.file = new md.XHRFile(url);
            var version = this.version = f.read(4);
            var numTables = f.UBInt16();
            var searchRange = f.UBInt16();
            var entrySelector = f.UBInt16();
            var rangeShift = f.UBInt16();
            this.headers = {};
            for (var i = 0; i < numTables; i++) {
                var tag = f.String(4);
                var checksum = f.UBInt32();
                var offset = f.UBInt32();
                var length = f.UBInt32();
                this.headers[tag] = {checksum: checksum, offset: offset, length: length, loaded: false};
            }
            this['head'] = new md.tbl_head(this, this.file, this.headers['head']);
            this['maxp'] = new md.tbl_maxp(this, this.file, this.headers['maxp']);
            this['loca'] = new md.tbl_loca(this, this.file, this.headers['loca']);
            this['glyf'] = new md.tbl_glyf(this, this.file, this.headers['glyf']);
        }
    }
});

md.tbl_head = Class.define({
    members: {
        init: function (font, file, header) {
            this.font = font;
            this.file = file;
            this.header = header;
            this.load();
        },

        load: function () {
            var f = this.file;
            f.seek(this.header.offset, md.SEEK_SET);
            this.version = f.Fixed32();
            this.revision = f.Fixed32();
            this.checksum = f.UBInt32();
            this.magic = f.read(4);
            this.flags = f.UBInt16();
            this.unitsPerEm = f.UBInt16();
            this.created = f.read(8);
            this.modified = f.read(8);
            this.xMin = f.SBInt16();
            this.yMin = f.SBInt16();
            this.xMax = f.SBInt16();
            this.yMax = f.SBInt16();
            this.maxStyle = f.UBInt16();
            this.lowestRectPPEM = f.UBInt16();
            this.fontDirectionHint = f.SBInt16();
            this.indexToLocFormat = f.SBInt16();
            this.glyphDataFormat = f.SBInt16();
        }
    }
});

md.tbl_maxp = Class.define({
    members: {
        init: function (font, file, header) {
            this.font = font;
            this.file = file;
            this.header = header;
            this.load();
        },

        load: function () {
            var f = this.file;
            f.seek(this.header.offset, md.SEEK_SET);
            this.tableVersion = f.SBInt32();
            this.numGlyphs = f.UBInt16();
            if (this.tableVersion != 0x00005000) {
                this.maxPoints = f.UBInt16();
                this.maxContours = f.UBInt16();
                this.maxCompositePoints = f.UBInt16();
                this.maxCompositeContours = f.UBInt16();
                this.maxZones = f.UBInt16();
                this.maxTwilightPoints = f.UBInt16();
                this.maxStorage = f.UBInt16();
                this.maxFunctionDefs = f.UBInt16();
                this.maxInstructionDefs = f.UBInt16();
                this.maxStackElements = f.UBInt16();
                this.maxSizeOfInstruction = f.UBInt16();
                this.maxComponentElements = f.UBInt16();
                this.maxComponentDepth = f.UBInt16();
            }
        }
    }
});

md.tbl_loca = Class.define({
    members: {
        init: function (font, file, header) {
            this.font = font;
            this.file = file;
            this.header = header;
            this.load();
        },

        load: function () {
            var longFormat = this.font['head'].indexToLocFormat;
            var f = this.file;
            f.seek(this.header.offset, md.SEEK_SET);
            var locations = [];
            if (longFormat == 1) {
                for (var i = 0; i < this.header.length / 4; i++) {
                    locations.push(f.SBInt32());
                }
            } else {
                for (var i = 0; i < this.header.length / 2; i++) {
                    locations.push(f.UBInt16());
                }
            }
            if (locations.length < (this.font['maxp'].numGlyphs + 1)) throw "Error: Corrupt 'loca' table or wrong 'numGlyphs' in table 'maxp'";
            this.locations = locations;
        }
    }
});

md.tbl_glyf = Class.define({
    members: {
        init: function (font, file, header) {
            this.font = font;
            this.file = file;
            this.header = header;
            this.load();
        },

        load: function () {
            var loca = this.font['loca'].locations;
            this.glyphs = {};
            var tbl_start = this.font.headers['glyf'].offset;
            for (var i = 0; i < loca.length; i++) {
                console.debug(i, loca[i] + tbl_start);
                this.glyphs[i] = new md.Glyph(this.file, loca[i] + tbl_start);
            }
        }
    }
});

md.Glyph = Class.define({
    members: {
        init: function (file, offset) {
            this.file = file;
            this.offset = offset;
            this.load();
        },

        load: function () {
            var f = this.file;
            f.seek(this.offset, md.SEEK_SET);
            this.header = {};
            this.header.numberOfContours = f.SBInt16();
            this.header.xMin = f.SBInt16();
            this.header.yMin = f.SBInt16();
            this.header.xMax = f.SBInt16();
            this.header.yMax = f.SBInt16();
        }
    }
});
