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
        let packsTypeIdSuffix = packsTypeArg && packsTypeArg.packsType ? packsTypeArg.packsType : null;
        if (!packsTypeIdSuffix) throw new Error(`Invalid pack type ID suffix: ${packsTypeIdSuffix}`);
        document.getElementById(`packs-type-${packsTypeIdSuffix}`).checked = true;
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

    function getDataFromDataExtension(columnsGroupKey) {
        return {
            id: `{{Contact.Attribute."Clientes Cluster Prepago".pack_${columnsGroupKey}_final}}`,
            price: `{{Contact.Attirube."Clientes Cluster Prepago".pack_${columnsGroupKey}_price}}`,
            balanceMessageTemplate: `{{Contact.Attribute."Clientes Cluster Prepago".pack_${columnsGroupKey}_msj_presta}}`,
            defaultPackId: `{{Contact.Attribute."Clientes Cluster Prepago".pack_prestado_final}}`,
            defaultPackMessageTemplate: `{{Contact.Attribute."Clientes Cluster Prepago".pack_prestado_msj}}`,
            defaultPackKeyword: `{{Contact.Attribute."Clientes Cluster Prepago".pack_prestado_kw}}`,
        };
    }

    connection.on('clickedNext', () => {
        let packsType = null;
        let attributeKeyWord = null;

        const CONSIDERED_PACK_TYPES = {
            REN_GIG: 'ren_gig',
            UPC: 'upc',
            MS: 'ms',
            COM_SCO: 'com_sco',
        };

        const { REN_GIG, UPC, MS, COM_SCO } = CONSIDERED_PACK_TYPES;

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

        if (![REN_GIG, UPC, MS, COM_SCO].includes(packsType)) throw new Error(`Invalid pack type: ${packsType}`);

        const {
            id: packId,
            price: packPrice,
            balanceMessageTemplate,
            defaultPackId,
            defaultPackMessageTemplate,
            defaultPackKeyword,
        } = getDataFromDataExtension(attributeKeyWord);

        activity['arguments'].execute.inArguments = [
            { packsType },
            { cellularNumber: `{{Contact.Attribute."Clientes Cluster Prepago".cellular_number}}` },
            { balance: `{{Interaction.${saldoCustomActivityKey}.saldo}}` },
            { packId },
            { packPrice },
            { balanceMessageTemplate },
            { defaultPackId },
            { defaultPackMessageTemplate },
            { defaultPackKeyword },
        ];

        activity['metaData'].isConfigured = true;
        connection.trigger('updateActivity', activity);
    });

    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        console.log("Requested TriggerEventDefinition", eventDefinitionModel.eventDefinitionKey);
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
