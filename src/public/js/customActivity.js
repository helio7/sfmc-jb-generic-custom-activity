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
        if (dataExtensionArg) $('#dataExtension').val(dataExtensionArg.dataExtension);

        const channelArg = inArguments.find(arg => arg.channel);
        if (channelArg) $('#channel').val(channelArg.channel);
    });

    connection.on('clickedNext', () => {
        const dataExtension = document.getElementById('dataExtension').value;
        const channel = document.getElementById('channel').value;
        const cellularNumber = "1121806490"; // Hardcodea aquí el celular de prueba
    
        // Verificar que los valores no estén vacíos
        if (!dataExtension || !channel) {
            console.error(new Error('Missing input parameters'));
            return;
        }
    
        const dataToSend = {
            dataExtension: dataExtension,
            channel: channel,
            cellularNumber: cellularNumber
        };
    
        payload['arguments'].execute.inArguments = [dataToSend];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
