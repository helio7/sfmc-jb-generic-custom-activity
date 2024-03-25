define(['postmonger'], (Postmonger) => {
    'use strict';

    let connection = new Postmonger.Session();
    let payload = {};
    let eventDefinitionKey;

    $(window).ready(() => {
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
    });

    connection.on('initActivity', (data) => {
        if (data) payload = data;

        const inArguments = Boolean(
            data.arguments &&
            data.arguments.execute &&
            data.arguments.execute.inArguments &&
            data.arguments.execute.inArguments.length > 0
        ) ? data.arguments.execute.inArguments : [];

        const dataExtensionArg = inArguments.find(arg => arg.dataExtension);
        if (dataExtensionArg) document.getElementById('dataExtension').value = dataExtensionArg.dataExtension;

        const channelArg = inArguments.find(arg => arg.channel);
        if (channelArg) document.getElementById('channel').value = channelArg.channel;
    });

    connection.on('clickedNext', () => {

        // if (!dataExtension || !channel) {
        //     console.error(new Error('Data Extension and Channel are required'));
        //     return;
        // }

        // const dataToSend = {
        //     dataExtension : dataExtension,
        //     cellularNumber: cellularNumber,
        //     channel: channel,

        // };

        payload['arguments'].execute.inArguments = [
            dataExtension = document.getElementById('dataExtension').value,
            channel = document.getElementById('channel').value,
            cellularNumber = `{{Contact.Attribute."${dataExtension}".cellular_number}}`
        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
