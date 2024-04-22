const CONSIDERED_PACK_TYPES = {
    REN_GIG: 'ren_gig',
    UPC: 'upc',
    MS: 'ms',
    COM_SCO: 'com_sco',
};

const DATA_EXTENSION_ATTRIBUTE_KEYWORDS_BY_PACK_TYPE = {
    [CONSIDERED_PACK_TYPES.REN_GIG]: 'renov_gigant',
    [CONSIDERED_PACK_TYPES.UPC]: 'upc',
    [CONSIDERED_PACK_TYPES.MS]: 'segmento',
    [CONSIDERED_PACK_TYPES.COM_SCO]: '1modl_comprdr',
};

const { REN_GIG, UPC, MS, COM_SCO } = CONSIDERED_PACK_TYPES;

function getPacksType() {
    let caPacksType;
    for (const packsType of [REN_GIG, UPC, MS, COM_SCO]) {
        if (document.getElementById(`packs-type-${packsType}`).checked) {
            caPacksType = packsType;
            break;
        }
    }
    return caPacksType;
}

define(['postmonger'], (Postmonger) => {
    'use strict';

    let connection = new Postmonger.Session();
    let activity = {};
    let eventDefinitionKey;

    $(window).ready(() => {
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

        const packsTypeArg = inArguments.find(arg => arg.packsType);
        let packsTypeIdSuffix = packsTypeArg && packsTypeArg.packsType ? packsTypeArg.packsType : REN_GIG;
        if (!packsTypeIdSuffix) throw new Error(`Invalid pack type ID suffix: ${packsTypeIdSuffix}`);
        document.getElementById(`packs-type-${packsTypeIdSuffix}`).checked = true;

        const dataExtensionArg = inArguments.find(arg => arg.dataExtension);
        if (dataExtensionArg) document.getElementById('dataExtension').value = dataExtensionArg.dataExtension;

        const externalIdPrefixArg = inArguments.find(arg => arg.externalIdPrefix);
        if (externalIdPrefixArg) document.getElementById('externalIdPrefix').value = externalIdPrefixArg.externalIdPrefix;
    });

    let saldoCustomActivityKey;

    connection.on('requestedInteraction', (payload) => {
        payload.activities.forEach((a) => {
            if (
                a.schema &&
                a.schema.arguments &&
                a.schema.arguments.execute &&
                a.schema.arguments.execute.outArguments &&
                a.schema.arguments.execute.outArguments.length > 0
            ) {
                for (const outArg of a.schema.arguments.execute.outArguments) {
                    if (outArg.saldo) {
                        saldoCustomActivityKey = a.key;
                        break;
                    }
                }
            }
        });
        // Let Journey Builder know the activity has changes.
        // connection.trigger("setActivityDirtyState", true);
    });

    connection.on('clickedNext', () => {
        const packsType = getPacksType();

        if (![REN_GIG, UPC, MS, COM_SCO].includes(packsType)) throw new Error(`Invalid pack type: ${packsType}`);

        let attributeKeyWord = DATA_EXTENSION_ATTRIBUTE_KEYWORDS_BY_PACK_TYPE[packsType];

        const dataExtension = document.getElementById('dataExtension').value;

        const cellularNumber = `{{Contact.Attribute."${dataExtension}".cellular_number}}`;
        const balance = `{{Interaction.${saldoCustomActivityKey}.saldo}}`;
        const packId = `{{Contact.Attribute."${dataExtension}".pack_${attributeKeyWord}_final}}`;
        const packPrice = `{{Contact.Attribute."${dataExtension}".pack_${attributeKeyWord}_price}}`;
        const balanceMessageTemplate = `{{Contact.Attribute."${dataExtension}".pack_${attributeKeyWord}_msj_presta}}`;
        const defaultPackId = `{{Contact.Attribute."${dataExtension}".pack_prestado_final}}`;
        const defaultPackMessageTemplate = `{{Contact.Attribute."${dataExtension}".pack_prestado_msj}}`;
        const defaultPackKeyword = `{{Contact.Attribute."${dataExtension}".pack_prestado_kw}}`;

        const externalIdPrefix = document.getElementById('externalIdPrefix').value;

        activity['arguments'].execute.inArguments = [
            { dataExtension: dataExtension ? dataExtension : null },
            { packsType: packsType ? packsType : null },
            { cellularNumber: cellularNumber ? cellularNumber : null },
            { balance: balance ? balance : null },
            { packId: packId ? packId : null },
            { packPrice: packPrice ? packPrice : null},
            { balanceMessageTemplate: balanceMessageTemplate ? balanceMessageTemplate : null },
            { defaultPackId: defaultPackId ? defaultPackId : null },
            { defaultPackMessageTemplate: defaultPackMessageTemplate ? defaultPackMessageTemplate : null },
            { defaultPackKeyword: defaultPackKeyword ? defaultPackKeyword : null },
            { externalIdPrefix: externalIdPrefix ? externalIdPrefix : null },
        ];

        activity['metaData'].isConfigured = true;
        connection.trigger('updateActivity', activity);
    });

    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        console.log("Requested TriggerEventDefinition", eventDefinitionModel.eventDefinitionKey);
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
