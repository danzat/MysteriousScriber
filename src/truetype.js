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
            for (var i = 0; i < numTables; i++) {
                var tag = f.String(4);
                var checksum = f.UBInt32();
                var offset = f.UBInt32();
                var length = f.UBInt32();
                this[tag] = {checksum: checksum, offset: offset, length: length};
            }
        },

        read_head: function () {
            var f = this.file;
            f.seek(this['head'].offset, md.SEEK_SET);
            this['head'].data = {};
            this['head'].data.version = f.Fixed32();
            this['head'].data.revision = f.Fixed32();
            this['head'].data.checksum = f.UBInt32();
            this['head'].data.magic = f.read(4);
            this['head'].data.flags = f.UBInt16();
            this['head'].data.unitsPerEm = f.UBInt16();
            this['head'].data.created = f.read(8);
            this['head'].data.modified = f.read(8);
            this['head'].data.xMin = f.SBInt16();
            this['head'].data.yMin = f.SBInt16();
            this['head'].data.xMax = f.SBInt16();
            this['head'].data.yMax = f.SBInt16();
            this['head'].data.maxStyle = f.UBInt16();
            this['head'].data.lowestRectPPEM = f.UBInt16();
            this['head'].data.fontDirectionHint = f.SBInt16();
            this['head'].data.indexToLocFormat = f.SBInt16();
            this['head'].data.glyphDataFormat = f.SBInt16();
        },
        
        read_maxp: function () {
            var f = this.file;
            f.seek(this['maxp'].offset, md.SEEK_SET);
            this['maxp'].data = {};
            this['maxp'].data.tableVersion = f.SBInt32();
            this['maxp'].data.numGlyphs = f.UBInt16();
            if (this['maxp'].data.tableVersion != 0x00005000) {
                this['maxp'].data.maxPoints = f.UBInt16();
                this['maxp'].data.maxContours = f.UBInt16();
                this['maxp'].data.maxCompositePoints = f.UBInt16();
                this['maxp'].data.maxCompositeContours = f.UBInt16();
                this['maxp'].data.maxZones = f.UBInt16();
                this['maxp'].data.maxTwilightPoints = f.UBInt16();
                this['maxp'].data.maxStorage = f.UBInt16();
                this['maxp'].data.maxFunctionDefs = f.UBInt16();
                this['maxp'].data.maxInstructionDefs = f.UBInt16();
                this['maxp'].data.maxStackElements = f.UBInt16();
                this['maxp'].data.maxSizeOfInstruction = f.UBInt16();
                this['maxp'].data.maxComponentElements = f.UBInt16();
                this['maxp'].data.maxComponentDepth = f.UBInt16();
            }
        },

        read_loca: function () {
            var longFormat = this['head'].indexToLocFormat;
            var f = this.file;
            f.seek(this['loca'].offset, md.SEEK_SET);
            var locations = [];
            if (longFormat == 1) {
                for (var i = 0; i < this['loca'].length / 4; i++) {
                    locations.push(f.SBInt32());
                }
            } else {
                for (var i = 0; i < this['loca'].length / 2; i++) {
                    locations.push(f.UBInt16());
                }
            }
            if (locations.length < (this['maxp'].data.numGlyphs + 1)) throw "Error: Corrupt 'loca' table or wrong 'numGlyphs' in table 'maxp'";
            this['loca'].data = {locations: locations};
        },

        loadGlyphs: function () {
            var f = this.file;
            f.seek(this['glyf'].offset, md.SEEK_SET);
            var numberOfContours = f.SBInt16();
            var xMin = f.SBInt16();
            var yMin = f.SBInt16();
            var xMax = f.SBInt16();
            var yMax = f.SBInt16();
            console.debug(numberOfContours, xMin, yMin, xMax, yMax);
            if (numberOfContours < 0) {
                numberOfContours = -numberOfContours;
                var flags = f.UBInt16();
                var glyph_index = f.UBInt16();
            }
        }
    }
});
