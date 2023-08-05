(function ($) {
    $.widget('pic.configValves', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgValves');
            $.getApiService('/config/options/valves', null, `Loading Options...`, function (opts, status, xhr) {
                console.log(opts);
                var valves = opts.valves;
                var pnl = $('<div></div>').addClass('pnlValves').appendTo(el);
                for (var i = 0; i < valves.length; i++) {
                    $('<div></div>').appendTo(pnl).pnlValveConfig({ valveTypes: opts.valveTypes, maxValves: opts.maxValves, circuits: opts.circuits, servers: opts.servers })[0].dataBind(valves[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                $('<div id="btnAddValve"></div>').appendTo(btnPnl).actionButton({ text: 'Add Valve', icon: '<i class="fas fa-plus"></i>' })
                    .on('click', function (e) {
                        var id = 0;
                        // el.find('input[data-bind=isVirtual]').each(function () {
                        //     if ($(this).val()) id++;
                        // });
                        var acc = $('<div></div>').appendTo(pnl).pnlValveConfig({ valveTypes: opts.valveTypes, maxValves: opts.maxValves, circuits: opts.circuits, servers: opts.servers });
                        acc[0].dataBind({
                            isIntake: false,
                            isReturn: false,
                            // isVirtual: true,
                            isActive: true,
                            master: 1,
                            type: 0,
                            id: -1,
                            name: 'Valve V' + (id + 1),
                            circuit: 256,
                            address: 179,
                            fwVersion: 0,
                            fwDate: 0,
                            did: 0,
                            rid: 0,
                            fwTag: 0,
                            fwBranch: 0,
                            UUID: [],
                            resetReason: "Unknown"
                        });
                        acc.find('div.picAccordian')[0].expanded(true);
                    });

                $('<div id="btnAddValve"></div>').appendTo(btnPnl).actionButton({ text: 'Search Valves', icon: '<i class="fas fa-plus"></i>' })
                    .on('click', function (e) {

                        $.getApiService('/config/valve/search', null, `Finding Valves, please refresh...`, function (opts, status, xhr) {location.reload()});
                    });

            });
        }
    });
})(jQuery); // Valves Tab
(function ($) {
    $.widget('pic.pnlValveConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgValve');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-compass', style: { width: '9rem' } }, { binding: 'type', style: { width: '14rem', textAlign: 'center' } }, { binding: 'circuit', style: { width: '8rem' } } ]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isIntake').appendTo(line);
            $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isReturn').appendTo(line);
            // $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isVirtual').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginLeft: '.25rem', width:'3rem' } } });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Valve Type', style: { whiteSpace: 'nowrap' } }],
                items: o.valveTypes, inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Circuit', binding: binding + 'circuit',
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                items: o.circuits, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Pin Id', binding: binding + 'pinId', min: 0, max: 100, step: 1, units: '', inputAttrs: { maxlength: 5 }, labelAttrs: { style: { marginLeft: '.25rem', width: '3rem'  } } });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Pin Id', binding: binding + 'pinId', min: 0, max: 100, step: 1, units: '', inputAttrs: { maxlength: 5 }, labelAttrs: { style: { marginLeft: '.25rem', width: '3rem'  } } });
            line = $('<div></div>').appendTo(pnl);

            // Add Intellivalve panel
            var iValveAllFWPnl = $('<div></div>').addClass('pnlIValveAllFW').appendTo(pnl).hide();
            line = $('<div></div>').appendTo(iValveAllFWPnl);
            $('<div></div>').appendTo(iValveAllFWPnl).staticField({
                labelText: 'FW Type:',
                binding: binding + 'fwType',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '3rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValveAllFWPnl).staticField({
                labelText: 'UUID:',
                binding: binding + 'UUID',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '3rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            var iValvePnl = $('<div></div>').addClass('pnlIValve').appendTo(pnl).hide();
            //line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).valueSpinner({
                labelText: 'RS485 Address',
                binding: binding + 'address',
                min: 160,
                max: 180,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '.25rem', width: '7.25rem'}}
            });
            $('<div></div>').appendTo(iValvePnl).valueSpinner({
                labelText: 'Endstop 0',
                binding: binding + 'endstop0Value',
                min: 0,
                max: 48,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '1rem', width: '5.25rem'}}
            });
            $('<div></div>').appendTo(iValvePnl).valueSpinner({
                labelText: 'Endstop 24',
                binding: binding + 'endstop24Value',
                min: 0,
                max: 48,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '1rem', width: '5.25rem'}}
            });
            line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'Selected Endstop:',
                binding: binding + 'selectedEndstop',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '8rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'Valve Mode:',
                binding: binding + 'currentMode',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '8rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'Valve Position:',
                binding: binding + 'currentPosition',
                dataType: 'number',
                fmtMask: '#,##0.0#',
                emptyMask: '----',
                units: '&deg',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '8rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});

            line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'FW Tag:',
                binding: binding + 'fwTag',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '5.5rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'FW Branch:',
                binding: binding + 'fwBranch',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '5.5rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'GIT Hash:',
                binding: binding + 'fwVersion',
                dataType: 'number',
                fmtMask: '0x',
                emptyMask: '----',
                units: '',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '5.5rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'FW Date:',
                binding: binding + 'fwDate',
                dataType: 'number',
                fmtMask: '0xDate',
                emptyMask: '----',
                units: '',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '4rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'DID:',
                binding: binding + 'did',
                dataType: 'number',
                fmtMask: '0x',
                emptyMask: '----',
                units: '',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '2rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'RID:',
                binding: binding + 'rid',
                dataType: 'number',
                fmtMask: '0x',
                emptyMask: '----',
                units: '',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '2rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'Last Reset Reason:',
                binding: binding + 'resetReason',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '8rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});

            $('<hr></hr>').appendTo(iValvePnl).css({ margin: '3px' });
            var tabs = $('<div></div>').appendTo(iValvePnl).tabBar();
            var tab = tabs[0].addTab({ id: 'tabValveCircuits', text: 'Circuits' });

            var pnlCircuits = $('<div class="cfgValve-pnlCircuits" style="text-align:right;"></div>').appendTo(tab);
            line = $('<div class="picCircuitsList-btnPanel"></div>').appendTo(pnlCircuits);
            $('<div><span>Valve Circuits</span></div>').appendTo(line);
            var btnCPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(line);
            var btnAddCircuit = $('<div></div>').appendTo(btnCPnl).actionButton({ text: 'Add Circuit', icon: '<i class="fas fa-plus" ></i>' });
            btnAddCircuit.on('click', function (e) {
                self.addCircuit({});
            });

            var clist = $('<div class="picCircuitsList-list" style="min-width:25rem;"></div>').appendTo(pnlCircuits);
            clist.on('click', 'i.picRemoveOption', function (e) {
                $(e.target).parents('div.picCircuitOption:first').remove();
                var rgx = /\[[0-9]\]/g;
                el.find('div.picCircuitsList-list:first > div.picCircuitOption').each(function (ndx) {
                    $(this).find('*[data-bind^="circuits["]').each(function () {
                        var bind = $(this).attr('data-bind');
                        $(this).attr('data-bind', bind.replace(rgx, '[' + ndx + ']'));
                    });
                });
            });
            clist.on('selchanged', 'div.picPickList[data-bind$=units]', function (e) {
                if (typeof e.oldItem !== 'undefined') {
                    var pmp = dataBinder.fromElement(el);
                    self.dataBind(pmp);
                }
            });

            tabs[0].showTab('tabValveCircuits', true);


            line = $('<div></div>').appendTo(iValvePnl);
            var bindpnl = $('<div></div>').addClass('pnlDeviceBinding').REMBinding({ servers: o.servers }).appendTo(pnl).hide();
            $('<hr></hr>').prependTo(bindpnl);


            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div id="btnSaveValve"></div>').appendTo(btnPnl).actionButton({ text: 'Save Valve', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                if (dataBinder.checkRequired(p)) {
                    $.putApiService('/config/valve', v, 'Saving Valve: ' + v.name + '...', function (data, status, xhr) {
                        console.log({ data: data, status: status, xhr: xhr });
                        self.dataBind(data);
                    });
                }
            });
            var btnDelete = $('<div id="btnDeleteValve"></div>').appendTo(btnPnl).actionButton({ text: 'Delete Valve', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteValve', {
                    message: 'Are you sure you want to delete Valve ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Valve',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgValve:first').remove();
                            else {
                                console.log('Deleting Valve');
                                $.deleteApiService('/config/valve', v, 'Deleting Valve...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgValve:first').remove();
                                });
                            }
                        }
                    },
                    {
                        text: 'No', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }]
                });
            });

        },
        addCircuit: function (circ) {
            var self = this, o = self.options, el = self.element;
            var clist = el.find('div.picCircuitsList-list:first');
            var circuits = clist.find('div.picCircuitOption');
            var line = $('<div class="picCircuitOption"></div>').appendTo(clist);
            var binding = 'circuits[' + circuits.length + '].';

            $('<div></div>').appendTo(line).pickList({
                required: true,
                labelText: 'Circuit', binding: binding + 'circuit', value: circ.circuit,
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                style: {marginLeft: '.25rem'},
                items: o.circuits, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem', display: 'none' } }
            });


            $('<div></div>').appendTo(line).valueSpinner({
                labelText: 'Endstop 0',

                binding: binding + 'endstop0Value',
                min: 0,
                max: 48,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '1rem', width: '5.25rem'}},
                canEdit: true
            });


            $('<div></div>').appendTo(line).valueSpinner({
                labelText: 'Endstop 24',
                binding: binding + 'endstop24Value',

                min: 0,
                max: 48,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '1rem', width: '5.25rem'}},
                canEdit: true
            });
            $('<i class="fas fa-trash picRemoveOption" style="margin-left:.25rem"></i>').appendTo(line);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            var type = o.valveTypes.find(elem => elem.val === obj.type);
            var circuit = o.circuits.find(elem => elem.id === obj.circuit);
            cols[0].elText().text(obj.name);
            cols[1].elText().text(type.desc);
            var ddCircuit = el.find('div.picPickList[data-bind$=circuit]');
            var fldName = el.find('div.picInputField[data-bind$=name]');
            if (makeBool(obj.isIntake) || makeBool(obj.isReturn)) {
                ddCircuit.hide()[0].required(false);
                fldName[0].disabled(true);
                cols[2].elText().text('Pool/Spa');
                //el.find('div.picBtnPanel').hide();
            }
            else {
                ddCircuit.show()[0].required(true);
                fldName[0].disabled(false);
                if (typeof circuit !== 'undefined')
                    cols[2].elText().text(circuit.name);
                else
                    cols[2].elText().text('');
            }
            el.find('div.picBtnPanel').show();
            if ((obj.type === 1)) el.find('div.pnlIValveAllFW').show();
            if ((obj.type === 1) && obj.fwType === "Eggys IVFW") el.find('div.pnlIValve').show();
            else el.find('div.pnlIValve').hide();

            if (obj.master === 1) el.find('div.pnlDeviceBinding').show();
            else el.find('div.pnlDeviceBinding').hide();

            if (makeBool(obj.isIntake)) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-arrow-circle-right').css('color', 'red');
            else if (makeBool(obj.isReturn)) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-arrow-circle-left').css('color', 'red');
            else if (makeBool(obj.isVirtual) || obj.master === 1) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'far fa-compass').css('color', '');
            else el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-compass').css('color', '');
            if (obj.isVirtual || obj.master === 1) {
                el.find('div.picValueSpinner[data-bind=pinId]').show();
                el.find('div.picActionButton#btnDeleteValve').show();
            }
            else {
                el.find('div.picValueSpinner[data-bind=pinId]').hide();
                el.find('div.picActionButton#btnDeleteValve').hide();
            }
            if (obj.isVirtual || obj.master === 1) {
                el.find('div.picValueSpinner[data-bind=address]').show();
                el.find('div.picActionButton#btnDeleteValve').show();
            }
            else {
                el.find('div.picValueSpinner[data-bind=address]').hide();
                el.find('div.picActionButton#btnDeleteValve').hide();
            }

            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Valve Panel
