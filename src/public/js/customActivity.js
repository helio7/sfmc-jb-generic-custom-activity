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

        const packsTypeArg = inArguments.find(arg => arg.packsType);
        let packsTypeIdSuffix = packsTypeArg && packsTypeArg.packsType ? packsTypeArg.packsType : null;
        if (!packsTypeIdSuffix) throw new Error(`Invalid pack type ID suffix: ${packsTypeIdSuffix}`);
        document.getElementById(`packs-type-${packsTypeIdSuffix}`).checked = true;
    });

    connection.on('clickedNext', () => {
        let packsType = null;
        let attributeKeyWord = null;

        const CONSIDERED_PACK_TYPES = {
            NOCHE: 'noche',
            REN_GIG: 'ren_gig',
            UPC: 'upc',
            MS: 'ms',
            COM_SCO: 'com_sco',
        };

        const { NOCHE, REN_GIG, UPC, MS, COM_SCO } = CONSIDERED_PACK_TYPES;

        if (document.getElementById(`packs-type-${NOCHE}`).checked) {
            packsType = NOCHE;
            attributeKeyWord = 'noche';
        }
        if (document.getElementById(`packs-type-${REN_GIG}`).checked) {
            packsType = REN_GIG;
            attributeKeyWord = 'renov_gigant';
        }
        else if (document.getElementById(`packs-type-${UPC}`).checked) {
            packsType = UPC;
            attributeKeyWord = 'upc';
        }
        else if (document.getElementById(`packs-type-${MS}`).checked) {
            packsType = MS;
            attributeKeyWord = 'segmento';
        } else if (document.getElementById(`packs-type-${COM_SCO}`).checked) {
            packsType = COM_SCO;
            attributeKeyWord = '1modl_comprdr';
        } else throw new Error('No pack type was selected.');

        if (![NOCHE, REN_GIG, UPC, MS, COM_SCO].includes(packsType)) throw new Error(`Invalid pack type: ${packsType}`);

        payload['arguments'].execute.inArguments = [
            { packsType },
            { cellularNumber: `{{Contact.Attribute."Clientes Cluster Prepago".cellular_number}}` },
            { packFinal: `{{Contact.Attribute."Clientes Cluster Prepago".pack_${attributeKeyWord}_final}}` },
            { mensajeVariables: `{{Contact.Attribute."Clientes Cluster Prepago".pack_${attributeKeyWord}_msj}}` },
        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
