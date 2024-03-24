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
        const dataExtension = $('#dataExtension').val();
        const channel = $('#channel').val();

        // Validar si los campos están vacíos o no
        if (!dataExtension || !channel) {
            console.error(new Error('Data Extension and Channel are required'));
            return;
        }

        // Construir el cuerpo de la solicitud
        const dataToSend = {
            cellularNumber: null, // Este valor se obtendrá de la dataExtension en el backend
            channel: channel
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
