const CONSIDERED_PACK_TYPES = {
    NOCHE: 'noche',
    REN_GIG: 'ren_gig',
    UPC: 'upc',
    MS: 'ms',
    COM_SCO: 'com_sco',
};

const DATA_EXTENSION_ATTRIBUTE_KEYWORDS_BY_PACK_TYPE = {
    [CONSIDERED_PACK_TYPES.NOCHE]: 'noche',
    [CONSIDERED_PACK_TYPES.REN_GIG]: 'renov_gigant',
    [CONSIDERED_PACK_TYPES.UPC]: 'upc',
    [CONSIDERED_PACK_TYPES.MS]: 'segmento',
    [CONSIDERED_PACK_TYPES.COM_SCO]: 'modl_comprdr',
};

const { NOCHE, REN_GIG, UPC, MS, COM_SCO } = CONSIDERED_PACK_TYPES;

function selectCompradorScoringPacksType() {
    document.getElementById("compradorScoringPacksTypeOptionsDiv").style.display = "block";
    connection.trigger("requestInteraction");
}

function unselectCompradorScoringPacksType() {
    document.getElementById("compradorScoringPacksTypeOptionsDiv").style.display = "none";
    connection.trigger("requestInteraction");
}

function getPacksType() {
    let caPacksType;
    for (const packsType of [NOCHE, REN_GIG, UPC, MS, COM_SCO]) {
        if (document.getElementById(`packs-type-${packsType}`).checked) caPacksType = packsType;
        break;
    }
    return caPacksType;
}

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

        if (packsTypeArg.packsType === COM_SCO) selectCompradorScoringPacksType();
        else unselectCompradorScoringPacksType();

        const packsType = getPacksType();
        if (packsType === COM_SCO) {
            const comScoModelNumberArg = inArguments.find(arg => arg.comScoModelNumber);
            if (comScoModelNumberArg) {
                document.getElementById('compradorScoringPacksTypeModelNumber').value = comScoModelNumberArg.comScoModelNumber;
            }
        }
    });

    connection.on('clickedNext', () => {
        const packsType = getPacksType();

        if (![NOCHE, REN_GIG, UPC, MS, COM_SCO].includes(packsType)) throw new Error(`Invalid pack type: ${packsType}`);

        const comScoModelNumber = document.getElementById("compradorScoringPacksTypeModelNumber").value;

        let attributeKeyWord;

        if (packsType === COM_SCO) attributeKeyWord = comScoModelNumber;

        attributeKeyWord += DATA_EXTENSION_ATTRIBUTE_KEYWORDS_BY_PACK_TYPE[packsType];

        payload['arguments'].execute.inArguments = [
            { packsType },
            { cellularNumber: `{{Contact.Attribute."Clientes Cluster Prepago".cellular_number}}` },
            { packFinal: `{{Contact.Attribute."Clientes Cluster Prepago".pack_${attributeKeyWord}_final}}` },
            { mensajeVariables: `{{Contact.Attribute."Clientes Cluster Prepago".pack_${attributeKeyWord}_msj}}` },
            { comScoModelNumber: Number(comScoModelNumber) },
        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
