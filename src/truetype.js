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

md.tbl_glyf = Class.define({
    members: {
        init: function (font, stream) {
            this.font = font;
            this.file = stream;
            this.load();
        },

        load: function () {
            var loca = this.font['loca'].locations;
            this.glyphs = {};
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

        render: function (ctx, dpi) {
            // there are always 72 points in 1 inch
            // so if I have <dpi> pixels in 1 inch
            // 72pt = <dpi>px --> 1pt = <dpi>/72 px
            var px2pt = dpi / 72;
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
            // draw a bounding box
            //ctx.strokeStyle = "blue";
            //ctx.strokeRect(this.xMin * px2pt, this.yMin * px2pt, this.xMax * px2pt - this.xMin * px2pt, this.yMax * px2pt - this.yMin * px2pt);
            // draw the baseline
            //ctx.strokeStyle = "red";
            //ctx.beginPath();
            //ctx.moveTo(this.xMin * px2pt, 0);
            //ctx.lineTo(this.xMax * px2pt, 0);
            //ctx.stroke();
            ctx.restore();
        },

        width: function (dpi) {
            if (this.file.length() == 0) return 0;
            return this.xMax * dpi / 72;
        },

        height: function (dpi) {
            if (this.file.length() == 0) return 0;
            return this.yMax * dpi / 72;
        },

        depth: function (dpi) {
            if (this.file.length() == 0) return 0;
            if (this.yMin < 0) return -this.yMin * dpi / 72;
            return 0;
        }
    }
});
