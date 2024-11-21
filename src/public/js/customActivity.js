let connection;

define(['postmonger'], (Postmonger) => {
    'use strict';

    let $ = jQuery.noConflict(); // Evitar conflicto con otras versiones de jQuery
    connection = new Postmonger.Session();
    let activity;

    // Configuration variables
    let eventDefinitionKey;

    $(window).ready(() => {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
        connection.trigger("requestTriggerEventDefinition");
        connection.trigger("requestInteraction");
    });

    connection.on('initActivity', (data) => {
        if (data) activity = data;

        const inArguments = Boolean(
            data.arguments &&
            data.arguments.execute &&
            data.arguments.execute.inArguments &&
            data.arguments.execute.inArguments.length > 0
        ) ? data.arguments.execute.inArguments : [];

        const dataExtensionArg = inArguments.find(arg => arg.dataExtension);
        if (dataExtensionArg) document.getElementById('dataExtension').value = dataExtensionArg.dataExtension;

    });

    connection.on('requestedInteraction', (payload) => {
        caMode = 'dependent'
        if (caMode === 'dependent') {    

            if (activity.arguments.execute.inArguments) {
                let existingSelection;
                for (const inArgument of activity.arguments.execute.inArguments) {
                    if (inArgument.mensajeTraducido) {
                        existingSelection = inArgument.mensajeTraducido;
                        break;
                    }
                }
                if (existingSelection && existingSelection.split(".").length == 3) selectedValue = existingSelection.split(".")[1];
            }
            // Populate the select dropdown.
            const selectElement = document.getElementById("messageActivity");
            var options = document.querySelectorAll('#messageActivity option');
            options.forEach(o => o.remove());

            payload.activities.forEach((a) => {
                if (
                    a.schema &&
                    a.schema.arguments &&
                    a.schema.arguments.execute &&
                    a.schema.arguments.execute.outArguments &&
                    a.schema.arguments.execute.outArguments.length > 0
                ) {
                    a.schema.arguments.execute.outArguments.forEach((inArg) => {
                        if (inArg.mensajeTraducido) {
                        let option = document.createElement("option");
                        option.text = `${a.name} - (${a.key})`;
                        option.value = a.key;
                        selectElement.add(option);
                        }
                    });
                }
            });
            if (selectElement.childElementCount > 0) {
                // If we have a previously selected value, repopulate that value.
                if (selectedValue) {
                    const selectOption = selectElement.querySelector(`[value='${selectedValue}']`);
                    if (selectOption) selectOption.selected = true;
                    else console.log("Could not select value from list", `[value='${selectedValue}]'`);
                }
                // Let Journey Builder know the activity has changes.
                connection.trigger("setActivityDirtyState", true);
            }
        }
    });

    connection.on('clickedNext', () => { // Save function within MC.

        const dataExtension = document.getElementById('dataExtension').value;
        const cellularNumber = `{{Contact.Attribute."${dataExtension}".cellular_number}}`;
        const idCampaing = `{{Contact.Attribute."${dataExtension}".campaing_id}}`;

        activity['arguments'].execute.inArguments = [
            { dataExtension: dataExtension ? dataExtension : null },
            { idCampaing: idCampaing ? idCampaing : null },
            { cellularNumber: cellularNumber ? cellularNumber : null }
        ];

        activity['metaData'].isConfigured = true;
        connection.trigger('updateActivity', activity);
    });

    /**
     * This function is to pull out the event definition within journey builder.
     * With the eventDefinitionKey, you are able to pull out values that passes through the journey
     */
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        console.log("Requested TriggerEventDefinition", eventDefinitionModel.eventDefinitionKey);
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});

function setSendAction() {
    connection.trigger('requestInteraction');
}

function setSaveAction() {
    connection.trigger('requestInteraction');
}

