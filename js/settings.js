var opener = Ext.air.NativeWindow.getRootHtmlWindow();

var userButton = null;

var listsCombo = null;
var listsStore = null;

var showListCombo = null;
var showListStore = null;

var locationsCombo = null;
var locationsStore = null;

var showReminder = null;
var reminderMinutes = null;

var storeTimeGroup = null;

var trackWorkTime = null;
var workTimePeriod = null;
var restPeriod = null;
var inactivityDelay = null;

Ext.onReady(function(){

	var tokenOk = function(user){
		userButton.setText(user.username+': remove permission');
		air.trace('Saving token '+opener.conn.authToken);
		opener.settings.set('authToken', opener.conn.authToken);
		buttonStatus = 2;
		opener.conn.getLists(function(lists){
			listsStore.removeAll();
			showListStore.removeAll();
			listsStore.add(new Ext.data.Record({
				id: 0,
				text: 'No default list'
			}));
			for(var i = 0; i<lists.length; i++){
				showListStore.add(new Ext.data.Record({
					id: lists[i].id,
					text: lists[i].name
				}));
				if(lists[i].smart)
					continue;
				listsStore.add(new Ext.data.Record({
					id: lists[i].id,
					text: lists[i].name
				}));

			}
			listsCombo.setValue(opener.settings.get('defaultList') || 0);
			var listNow = opener.settings.get('showList') || 0;
			if(showListStore.getById(listNow))
				showListCombo.setValue(listNow);
			else
				showListCombo.setValue(showListStore.getAt(0).get('id'));
			mask.hide();
		}, function(){
			mask.hide();
		});
		opener.conn.getLocations(function(locs){
			locationsStore.removeAll();
			locationsStore.add(new Ext.data.Record({
				id: 0,
				text: 'No default location'
			}));
			for(var i = 0; i<locs.length; i++){
				locationsStore.add(new Ext.data.Record({
					id: locs[i].id,
					text: locs[i].name+(locs[i].address?
										' ('+locs[i].address+')':
										'')
				}));
			}
			locationsCombo.setValue(opener.settings.get('defaultLocation') || 0);
			mask.hide();
		}, function(){
			mask.hide();
		});

	};

	var buttonStatus = -1;
	userButton = new Ext.Button({
		text: 'Checking...',
		fieldLabel: 'User permission status',
		width: '100%',
		handler: function(){
			if(buttonStatus==2){
				opener.conn.authToken = '';
				opener.settings.set('authToken', '');
				buttonStatus = 0;
				userButton.setText('Grant permission');
			}else{
				if(buttonStatus==0){
					//Start permission
					mask.show();
					opener.conn.getFrob(function(frob){
						air.navigateToURL(new air.URLRequest(opener.conn.buildURL({
							perms: 'delete',
							frob: frob
						}, null, 'http://www.rememberthemilk.com/services/auth/')));
						mask.hide();
						buttonStatus = 1;
						userButton.setText('Confirm permission');
					}, function(code, msg){
						mask.hide();
						showError(msg);
						//Show error here
					});
				}else{
					mask.show();
					opener.conn.getToken(function(user){
						tokenOk(user);
					}, function(code, msg){
						mask.hide();
						showError(msg);
						//Show error
					});
					//Confirm
				}
			}
		}
	});

	listsStore = new Ext.data.ArrayStore({
        id: 0,
        fields: [
            'id',
            'text'
        ]
	});
	listsCombo = new Ext.form.ComboBox({
		store: listsStore,
		editable: false,
		triggerAction: 'all',
		mode: 'local',
		valueField: 'id',
		displayField: 'text',
		valueNotFoundText: 'Invalid value',
		fieldLabel: 'Default list for new tasks'
	});

	showListStore = new Ext.data.ArrayStore({
        id: 0,
        fields: [
            'id',
            'text'
        ]
	});
	showListCombo = new Ext.form.ComboBox({
		store: showListStore,
		editable: false,
		triggerAction: 'all',
		mode: 'local',
		valueField: 'id',
		displayField: 'text',
		valueNotFoundText: 'Invalid value',
		fieldLabel: 'Display list'
	});

	locationsStore = new Ext.data.ArrayStore({
        id: 0,
        fields: [
            'id',
            'text'
        ]
	});
	locationsCombo = new Ext.form.ComboBox({
		store: locationsStore,
		editable: false,
		triggerAction: 'all',
		mode: 'local',
		valueField: 'id',
		displayField: 'text',
		valueNotFoundText: 'Invalid value',
		fieldLabel: 'Default location for new tasks'
	});


	showReminder = new Ext.form.Checkbox({
		boxLabel: 'Show reminder'
	});
	showReminder.on('check', function(ch, state){
		reminderMinutes.setDisabled(!state);
	});
	showReminder.setValue(opener.settings.get('showReminder'));

	reminderMinutes = new Ext.form.NumberField({
		minValue: 1,
		maxValue: 120,
		fieldLabel: 'Minutes before the task is due',
		increment: 1,
		value: opener.settings.get('reminderMinutes') || 5
	});
	reminderMinutes.setDisabled(!opener.settings.get('showReminder'));

	storeTimeGroup = new Ext.form.RadioGroup({
		fieldLabel: 'Save task execution time',
		columns: 1,
		items: [
			{
				inputValue: 0,
				boxLabel: 'Don\'t save time'
			},{
				inputValue: 1,
				boxLabel: 'Override "Time estimate" field'
			},{
				inputValue: 2,
				boxLabel: 'Save as a note'
			}
		],
		value: opener.settings.get('storeTimeGroup') || 1
	});

	var form = new Ext.form.FormPanel({
		frame: 'true',
		labelWidth: 200,
		defaults:{
		anchor: '100%'
		},
		items:[
			userButton, showListCombo, listsCombo, locationsCombo, showReminder, reminderMinutes, storeTimeGroup
		],
		buttons:[
			{
				text: 'Ok'
			},{
				text: 'Cancel'
			}
		]
	});
	window.nativeWindow.activate();
	new Ext.Viewport({
		layout: 'fit',
		items: form
	});
	var mask = new Ext.LoadMask(Ext.getBody(), {msg:'Please wait...'});
	mask.show();
	opener.conn.checkToken(function(user){
		tokenOk(user);
	}, function(){
		buttonStatus = 0;
		userButton.setText('Grant permission');
		mask.hide();
	});
});