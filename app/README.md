# logplotter
Visual representation for logged CAN bus communication

In order to populate the interface (dropdown and checkboxes), it is required to parse the database input by the user into an unique format. This format has as focus the signals (column 1), which are the main information needed to populate the graph later on.

Regardless of the format of the database (DBC, SYM, etc), the information shall be converted to the following format:

Information as per database-user.csv
SIGNALS , ID    ,ECU        ,MSGNAME    ,NODE   ,NETWORK
Voltage , 0x100 ,Main ECU   ,Status1    ,       ,Internal
Current , 0x100 ,Main ECU   ,Status1    ,       ,Internal
State   , 0x100 ,Main ECU   ,Status2    ,       ,External
Error   , 0x358 ,Main ECU   ,Status2    ,       ,External

Example of the five first lines:
0: ['SIGNALS', 'ID', 'ECU', 'NODE']
1: ['Voltage', '0x100', 'Main ECU', 'Internal']
2: ['Current', '0x100', 'Main ECU', 'Internal']
3: ['State', '0x100', 'Main ECU', 'External']
4: ['Error', '0x358', 'Main ECU', 'External']

The information ready to be used by further processing shall be stored in appState.parsedCSV.

This format has the signals on column A. The signals are unique and shall not be duplicated. If a signal is repeated into two different frames, an unique identifier has to be concatenaded to the end of the name.
Example: If a signal named Voltage is present in two different frames, the frame ID might be added at the end.
    Voltage (0x100)
    Voltage (0x358)

The remaining columns are properties that are used by the user to narrow down the search and ultimatly come with a list of desired signals.

Example: User select form the dropdown the source to be IDs. The Checkbox Filter Sources will then be populated with all IDs present in the database. Once the user select the IDs which he wants to see, the checkbox Filter Signals will be populated with all signals that matches the IDs selected.