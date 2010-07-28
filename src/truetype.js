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
            this['head'] = new md.tbl_head(this, f.copy(this.headers['head'].offset, this.headers['head'].length));
            this['maxp'] = new md.tbl_maxp(this, f.copy(this.headers['maxp'].offset, this.headers['maxp'].length));
            this['loca'] = new md.tbl_loca(this, f.copy(this.headers['loca'].offset, this.headers['loca'].length));
            this['cmap'] = new md.tbl_cmap(this, f.copy(this.headers['cmap'].offset, this.headers['cmap'].length));
            this['post'] = new md.tbl_post(this, f.copy(this.headers['post'].offset, this.headers['post'].length));
            this['glyf'] = new md.tbl_glyf(this, f.copy(this.headers['glyf'].offset, this.headers['glyf'].length));
        }
    }
});

md.tbl_head = Class.define({
    members: {
        init: function (font, stream) {
            this.font = font;
            this.file = stream;
            this.load();
        },

        load: function () {
            var f = this.file;
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
        init: function (font, stream) {
            this.font = font;
            this.file = stream;
            this.load();
        },

        load: function () {
            var f = this.file;
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
        init: function (font, stream) {
            this.font = font;
            this.file = stream;
            this.load();
        },

        load: function () {
            var longFormat = this.font['head'].indexToLocFormat;
            var f = this.file;
            var locations = [];
            if (longFormat == 1) {
                for (var i = 0; i < f.length() / 4; i++) {
                    locations.push(f.SBInt32());
                }
            } else {
                for (var i = 0; i < f.length() / 2; i++) {
                    locations.push(2 * f.UBInt16());
                }
            }
            if (locations.length < (this.font['maxp'].numGlyphs + 1)) throw "Error: Corrupt 'loca' table or wrong 'numGlyphs' in table 'maxp'";
            this.locations = locations;
        }
    }
});

md.tbl_cmap = Class.define({
    members: {
        init: function (font, stream) {
            this.font = font;
            this.file = stream;
            this.maps = [];
            this.load();
        },

        load: function () {
            var f = this.file;
            var tableVersion = f.UBInt16();
            var numSubTables = f.UBInt16();
            for (var i = 0; i < numSubTables; i++) {
                var platformID = f.UBInt16();
                var platEncID = f.UBInt16();
                var offset = f.SBInt32();
                var format = f.UBInt16(offset);
                var length = f.UBInt16(offset + 2);
                this.processCMAPSubTable(f.copy(offset, length), format);
            }
        },

        processCMAPSubTable: function (f, format) {
            if (format == 0) {
                this.processFormat0(f);
            } else if (format == 4) {
                this.processFormat4(f);
            }
        },

        processFormat0: function (f) {
            var map = {};
            map.type = 0;
            var format = f.UBInt16();
            var length = f.UBInt16();
            var language = f.UBInt16();
            map.language = language;
            map.map = f.read(256);
            this.maps.push(map);
        },

        processFormat4: function (f) {
        },

        getGlyphIndex: function (c) {
            // this sould go over the tables and retrieve the most suitable index
            // I only use format0
            return this.maps[0].map[c.charCodeAt(0)];
        }
    }
});

md.tbl_post = Class.define({
    members: {
        init: function (font, stream) {
            this.font = font;
            this.file = stream;
            this.maps = [];
            this.load();
        },

        load: function () {
            var f = this.file;
            this.format = f.Fixed32();
            this.italicRange = f.Fixed32();
            this.underlinePosition = f.SBInt16();
            this.underlineThikness = f.SBInt16();
            this.isFixedPitch = f.UBInt32();
            this.minMemType42 = f.UBInt32();
            this.maxMemType42 = f.UBInt32();
            this.minMemType1 = f.UBInt32();
            this.maxMemType1 = f.UBInt32();
            if (this.format == 2) {
                this.numberOfGlyphs = f.UBInt16();
                if (this.numberOfGlyphs != this.font['maxp'].numGlyphs) {
                    throw "Error: numberOfGlyphs do not match between 'maxp' (" + this.font['maxp'].numGlyphs + ") and 'post' (" + this.numberOfGlyphs + ")";
                }
                this.glyphNameIndex = [];
                for (var i = 0; i < this.numberOfGlyphs; i++) {
                    this.glyphNameIndex.push(f.UBInt16());
                }
                this.glyphNames = [];
                while (!f.eof()) {
                    var len = f.Byte();
                    var name = f.String(len);
                    this.glyphNames.push(name);
                }
                this.map = {};
                var c;
                for (var i = 0; i < this.numberOfGlyphs; i++) {
                    c = this.glyphNameIndex[i];
                    if (c >= 258) c -= 258;
                    this.map[this.glyphNames[c]] = i;
                }
            } else {
                console.debug("Warning: 'post' format not supported: ", this.format);
            }
        }
    }
});

md.tbl_glyf = Class.define({
    members: {
        init: function (font, stream) {
            this.font = font;
            this.file = stream;
            this.load();
        },

        load: function () {
            var loca = this.font['loca'].locations;
            this.glyphs = [];
            for (var i = 0; i < loca.length - 1; i++) {
                this.glyphs[i] = new md.Glyph(this.file.copy(loca[i], loca[i+1] - loca[i]), this.font['head'].unitsPerEm);
            }
        }
    }
});

md.flagOnCurve = 0x01;
md.flagXShort = 0x02;
md.flagYShort = 0x04;
md.flagRepeat = 0x08;
md.flagXSame = 0x10;
md.flagYSame = 0x20;

md.Glyph = Class.define({
    members: {
        init: function (stream, unitsPerEm) {
            this.pointsPerUnit = 12 / unitsPerEm;
            this.file = stream;
            if (this.file.length() != 0) {
                this.load();
            }
        },

        load: function () {
            var f = this.file;
            this.numberOfContours = f.SBInt16();
            var pointsPerUnit = this.pointsPerUnit;
            this.xMin = f.SBInt16() * pointsPerUnit;
            this.yMin = f.SBInt16() * pointsPerUnit;
            this.xMax = f.SBInt16() * pointsPerUnit;
            this.yMax = f.SBInt16() * pointsPerUnit;
            if (this.numberOfContours == -1) {
                this.loadComponents();
            } else {
                this.loadCoordinates();
            }
        },

        loadCoordinates: function () {
            // there are 12 points in 1 em
            var pointsPerUnit = this.pointsPerUnit;
            var f = this.file;
            var endPointsOfContours = [];
            for (var i = 0; i < this.numberOfContours; i++) {
                endPointsOfContours.push(f.UBInt16());
            }
            var instructionLength = f.UBInt16();
            var instructions = [];
            for (var i = 0; i < instructionLength; i++) {
                instructions.push(f.Byte())
            }
            var nCoordinates = endPointsOfContours[this.numberOfContours - 1] + 1;
            // now we need to extract the flags information to build a specification for reading the x,y coordinate list
            var j = 0;
            i = 0;
            var xspecs = [];
            var yspecs = [];
            var flags = [];
            var flag;
            var repeat;
            while (j < nCoordinates) {
                flag = f.Byte();
                i++;
                repeat = 1;
                if (flag & md.flagRepeat) {
                    repeat = f.Byte() + 1;
                    i++;
                }
                for (var k = 0; k < repeat; k++) {
                    if (flag & md.flagXShort) {
                        xspecs.push('B');
                    } else if (!(flag & md.flagXSame)) {
                        xspecs.push('h');
                    }
                    if (flag & md.flagYShort) {
                        yspecs.push('B');
                    } else if (!(flag & md.flagYSame)) {
                        yspecs.push('h');
                    }
                    flags[j] = flag;
                    j++;
                }
            }
            // load the raw data
            var xCoords = [];
            for (i = 0; i < xspecs.length; i++) {
                if (xspecs[i] == 'B')
                    xCoords.push(f.Byte());
                else /* xspecs[i] == 'h' */
                    xCoords.push(f.SBInt16());
            }
            var yCoords = [];
            for (i = 0; i < yspecs.length; i++) {
                if (yspecs[i] == 'B')
                    yCoords.push(f.Byte());
                else /* xspecs[i] == 'h' */
                    yCoords.push(f.SBInt16());
            }
            // now filter it with the flags information to extract a list of endpoints
            var ix = 0, iy = 0;
            var dx, dy;
            var x = 0, y = 0;
            var coords = [];
            var contours = [];
            var icontour = 0;
            for (var i = 0; i < nCoordinates; i++) {
                flag = flags[i];
                // x coordinate
                if (flag & md.flagXShort) {
                    if (flag & md.flagXSame)
                        dx = xCoords[ix];
                    else
                        dx = -xCoords[ix];
                    ix++;
                } else if (flag & md.flagXSame) {
                    dx = 0;
                } else {
                    dx = xCoords[ix];
                    ix++;
                }
                // y coordinate
                if (flag & md.flagYShort) {
                    if (flag & md.flagYSame)
                        dy = yCoords[iy];
                    else
                        dy = -yCoords[iy];
                    iy++;
                } else if (flag & md.flagYSame) {
                    dy = 0;
                } else {
                    dy = yCoords[iy];
                    iy++;
                }
                x += dx;
                y += dy;
                coords.push({x: x * pointsPerUnit, y: y * pointsPerUnit, q: (flag & md.flagOnCurve) == md.flagOnCurve});
                if (i == endPointsOfContours[icontour]) {
                    coords.push(coords[0]);
                    contours.push(coords);
                    icontour++;
                    coords = [];
                }
            }
            this.contours = contours;
        },

        render: function (ctx, scale, dpi) {
            // there are always 72 points in 1 inch
            // so if I have <dpi> pixels in 1 inch
            // 72pt = <dpi>px --> 1pt = <dpi>/72 px
            var px2pt = scale * dpi / 72;
            if (this.file.length() == 0) return;
            ctx.save();
            ctx.beginPath();
            for (var k = 0; k < this.contours.length; k++) {
                var v = this.contours[k];
                ctx.moveTo(v[0].x * px2pt, v[0].y * px2pt);
                var i = 1;
                while (i < v.length) {
                    if (v[i].q) {
                        ctx.lineTo(v[i].x * px2pt, v[i].y * px2pt);
                    } else {
                        ctx.quadraticCurveTo(v[i].x * px2pt, v[i].y * px2pt, v[i+1].x * px2pt, v[i+1].y * px2pt);
                        i++;
                    }
                    i++;
                }
            }
            ctx.fill();
            ctx.restore();
        },

        width: function (dpi, scale) {
            if (this.file.length() == 0) return 0;
            return scale * this.xMax * dpi / 72;
        },

        height: function (dpi, scale) {
            if (this.file.length() == 0) return 0;
            return scale * this.yMax * dpi / 72;
        },

        depth: function (dpi, scale) {
            if (this.file.length() == 0) return 0;
            if (this.yMin < 0) return -scale * this.yMin * dpi / 72;
            return 0;
        }
    }
});
