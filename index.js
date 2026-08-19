const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');

const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, 
    ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const config = require('./config.json');

// Reemplaza por el ID real de tu rol Staff Team para las menciones y permisos
const ID_ROL_STAFF = "1537656749719556197"; 

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const commands = [
    new SlashCommandBuilder().setName('hola').setDescription('El bot te saluda amigablemente'),
    new SlashCommandBuilder().setName('setup-tickets').setDescription('Crea el panel avanzado de tickets con menú desplegable').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('ip').setDescription('Muestra las direcciones de conexión para MineSky Network')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.TOKEN);

client.once('ready', async () => {
    console.log(`🤖 ¡Bot conectado como ${client.user.tag}!`);
    try {
        // Registra los comandos DIRECTO en tu servidor para que salgan al instante
        // Reemplaza 'TU_ID_DE_SERVIDOR' por el ID real de tu servidor de Discord
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, '1537627196909297664'),
            { body: commands }
        );
        console.log('✅ ¡Sistema de tickets con Formularios Emergentes (Modals) listo!');
    } catch (error) {
        console.error('Error al registrar comandos:', error);
    }
});

    // ENVIAR PANEL PRINCIPAL
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup-tickets') {
        const embedMenu = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`Soporte de MineSky\nMineSky | Network\n\n¡SISTEMA DE TICKET - SOPORTE!`)
            .setDescription(
                '¡Bienvenido al Sistema de Tickets de MineSky!\n\n' +
                'Para brindarte la mejor atención, seleccione la categoría que corresponda a tu situación:\n\n' +
                '🛒 **Tienda**: Problemas con compras, rangos o paquetes del servidor.\n\n' +
                '<:pregunta:1537972783118819379> **Soporte**: Ayuda técnica, dudas generales y asistencia en el servidor.\n\n' +
                '👤 **Reportes**: Denuncias sobre jugadores, hacks o comportamiento inapropiado.\n\n' +
                '<:minecraft:1537972467321147432>  **Rollback**: Restauración del inventario o pérdidas por errores del servidor.\n\n' +
                '<:tuputmdr:1537975245527326840> **Apelaciones**: Solicitud de revisión de sanciones o proceso de SS.\n\n' +
                '💼 **Staff Apply**: Postulaciones para el Staff Team.\n\n' +
                '<:pregunta:1537972783118819379> **Media Apply**: Postulaciones para el Media Team.\n\n' +
                '<:ma_65:1515536388156821637> **Reportar Staff**: Reporta mal trato o injusticias.\n\n' +
                'Copyright © 2026 | MineSky Network'
            );

        const menuSeleccion = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_tickets')
                .setPlaceholder('Select an option')
                .addOptions([
                    { label: 'Tienda', value: 'ticket_tienda', description: 'Problemas de compras o rangos', emoji: '🛒' },
                    { label: 'Soporte', value: 'ticket_soporte', description: 'Ayuda técnica y dudas generales', emoji: '⚙️' },
                    { label: 'Staff Apply', value: 'ticket_staff', description: 'Postulaciones para el Staff Team', emoji: '🌸' },
                    { label: 'Media Applys', value: 'ticket_media', description: 'Postulaciones para el Media Team', emoji: '🌟' },
                    { label: 'Apelaciones', value: 'ticket_apelaciones', description: 'Revisión de sanciones o procesos de SS', emoji: '🐸' },
                    { label: 'Reportar Bug', value: 'ticket_bug', description: 'Errores dentro del servidor', emoji: '🚨' },
                    { label: 'Reportar Usuario', value: 'ticket_usuario', description: 'Hacks o comportamiento indebido', emoji: '👤' },
                    { label: 'Reportar Staff', value: 'ticket_rstaff', description: 'Reporta anomalías con el Staff', emoji: '🐗' }
                ])
        );

        await interaction.reply({ content: '✅ Panel avanzado generado.', ephemeral: true });
        await interaction.channel.send({ embeds: [embedMenu], components: [menuSeleccion] });
    }

    // ACCIÓN: EL USUARIO SELECCIONA UNA OPCIÓN (ABRIR FORMULARIO FLOTANTE)
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_tickets') {
        const tipoTicket = interaction.values[0].replace('ticket_', '');
        
        // Crear el Formulario Flotante (Modal)
        const modal = new ModalBuilder()
            .setCustomId(`modal_${tipoTicket}`)
            .setTitle(`Formulario: ${tipoTicket.toUpperCase()}`);

        // Campo 1 común: Nick del juego
        const campoNick = new TextInputBuilder()
            .setCustomId('input_nick')
            .setLabel('¿CUÁL ES TU NICK? *')
            .setPlaceholder('Escribe tu mensaje aquí...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Campos variables según la opción elegida
        let campoDos, campoTres;

        if (tipoTicket === 'tienda') {
            campoDos = new TextInputBuilder().setCustomId('input_dos').setLabel('¿QUÉ PRODUCTO COMPRASTE? *').setPlaceholder('Escribe aquí el rango o paquete...').setStyle(TextInputStyle.Short).setRequired(true);
            campoTres = new TextInputBuilder().setCustomId('input_tres').setLabel('PROBLEMA O DUDA *').setPlaceholder('Explica tu problema y detalla tu ID de pago...').setStyle(TextInputStyle.Paragraph).setRequired(true);
        } else if (tipoTicket === 'soporte') {
            campoDos = new TextInputBuilder().setCustomId('input_dos').setLabel('MODALIDAD *').setPlaceholder('Escribe tu mensaje aquí...').setStyle(TextInputStyle.Short).setRequired(true);
            campoTres = new TextInputBuilder().setCustomId('input_tres').setLabel('PROBLEMA O DUDA *').setPlaceholder('Escribe tu mensaje aquí...').setStyle(TextInputStyle.Paragraph).setRequired(true);
        } else if (tipoTicket === 'staff') {
            campoDos = new TextInputBuilder().setCustomId('input_dos').setLabel('¿QUÉ EDAD Y PAÍS TIENES? *').setPlaceholder('Ej: 16 años, México...').setStyle(TextInputStyle.Short).setRequired(true);
            campoTres = new TextInputBuilder().setCustomId('input_tres').setLabel('¿TIENES EXPERIENCIA PREVIA? *').setPlaceholder('Detalla tus antiguos rangos y servidores...').setStyle(TextInputStyle.Paragraph).setRequired(true);
        } else if (tipoTicket === 'media') {
            campoDos = new TextInputBuilder().setCustomId('input_dos').setLabel('ENLACE DE TU CANAL / RED SOCIAL *').setPlaceholder('YouTube, Twitch o TikTok...').setStyle(TextInputStyle.Short).setRequired(true);
            campoTres = new TextInputBuilder().setCustomId('input_tres').setLabel('SEGUIDORES Y PROMEDIO DE VISITAS *').setPlaceholder('Escribe tus estadísticas actuales...').setStyle(TextInputStyle.Paragraph).setRequired(true);
        } else if (tipoTicket === 'apelaciones') {
            campoDos = new TextInputBuilder().setCustomId('input_dos').setLabel('¿QUÉ RAZÓN Y STAFF TE SANCIONÓ? *').setPlaceholder('Escribe el motivo del ban...').setStyle(TextInputStyle.Short).setRequired(true);
            campoTres = new TextInputBuilder().setCustomId('input_tres').setLabel('¿POR QUÉ DEBERÍAMOS DESBANEARTE? *').setPlaceholder('Explica tu caso con total honestidad...').setStyle(TextInputStyle.Paragraph).setRequired(true);
        } else { // Reportes de Bugs, Usuarios o Staff
            campoDos = new TextInputBuilder().setCustomId('input_dos').setLabel('¿A QUIÉN O QUÉ REPORTAS? *').setPlaceholder('Escribe el nombre del usuario o sección...').setStyle(TextInputStyle.Short).setRequired(true);
            campoTres = new TextInputBuilder().setCustomId('input_tres').setLabel('DETALLES Y PRUEBAS *').setPlaceholder('Explica la situación (Podrás subir fotos/videos en el chat)...').setStyle(TextInputStyle.Paragraph).setRequired(true);
        }

        modal.addComponents(
            new ActionRowBuilder().addComponents(campoNick),
            new ActionRowBuilder().addComponents(campoDos),
            new ActionRowBuilder().addComponents(campoTres)
        );

        // Muestra la ventana flotante en la pantalla del usuario
        await interaction.showModal(modal);
    }

    // ACCIÓN: EL USUARIO ENVÍA EL FORMULARIO RELLENADO (CREAR EL CANAL)
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        await interaction.deferReply({ ephemeral: true });

        const tipoTicket = interaction.customId.replace('modal_', '');
        const nombreCanal = `${tipoTicket}-${interaction.user.username}`.toLowerCase();

        const existente = interaction.guild.channels.cache.find(ch => ch.name === nombreCanal);
        if (existente) return await interaction.editReply({ content: `❌ Ya cuentas con una consulta abierta aquí: ${existente}` });

        // Obtener lo que el usuario escribió en el Modal
        const respuestas = {
            nick: interaction.fields.getTextInputValue('input_nick'),
            campo2: interaction.fields.getTextInputValue('input_dos'),
            campo3: interaction.fields.getTextInputValue('input_tres')
        };

        // Rastrear las etiquetas de los títulos según el tipo
        let label2 = "Campo 2", label3 = "Campo 3";
        if (tipoTicket === 'soporte') { label2 = "Modalidad"; label3 = "Problema o Duda"; }
        else if (tipoTicket === 'tienda') { label2 = "Producto comprado"; label3 = "Problema o Duda"; }
        else if (tipoTicket === 'staff') { label2 = "Edad y País"; label3 = "Experiencia Previa"; }
        else if (tipoTicket === 'media') { label2 = "Canal / Red Social"; label3 = "Seguidores y Vistas"; }
        else if (tipoTicket === 'apelaciones') { label2 = "Sanción y Staff"; label3 = "Motivos de apelación"; }
        else { label2 = "Reportado / Ubicación"; label3 = "Detalles y Pruebas"; }

        const idCategorias = {
            tienda: "1538739300370223195",
            soporte: "1538739392317886494",
            staff: "1538739480679161977",
            media: "1538739994024349797",
            apelaciones: "1538739787861860392",
            bug: "1538746648937635860",
            usuario: "1538739480679161977",
            rstaff: "1538740125843062958"
        };

        try {
            const canal = await interaction.guild.channels.create({
                name: nombreCanal,
                type: ChannelType.GuildText,
                parent: idCategorias[tipoTicket] || null,
                permissionOverwrites: [
                    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    { id: ID_ROL_STAFF, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            // Embed que organiza las respuestas del Formulario en bloques limpios
            const embedInterno = new EmbedBuilder()
                .setColor('#2ed573')
                .setTitle(`🎫 Ticket de ${tipoTicket.toUpperCase()}`)
                .setDescription(
                    `Hola ${interaction.user}, bienvenido a tu ticket.\n` +
                    `Un miembro del staff te atenderá lo antes posible.\n\n` +
                    `📋 **FORMULARIO RELLENADO:**\n` +
                    `• **¿Cuál es tu Nick?**\n*${respuestas.nick}*\n\n` +
                    `• **¿${label2.toUpperCase()}?**\n*${respuestas.campo2}*\n\n` +
                    `• **¿${label3.toUpperCase()}?**\n*${respuestas.campo3}*`
                )
                .setFooter({ text: 'MineSky Network | Respuestas del Modal' })
                .setTimestamp();

            const botonesSoporte = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('reclamar_ticket').setLabel('Reclamar ticket').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️'),
                new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
            );

            await canal.send({ 
                content: `👋 ${interaction.user} | <@&${ID_ROL_STAFF}>`, 
                embeds: [embedInterno], 
                components: [botonesSoporte] 
            });
            
            await interaction.editReply({ content: `✅ Formulario enviado. Canal creado exitosamente en: ${canal}` });

        } catch (e) { console.error(e); }
    }

    // ACCIÓN DE LOS BOTONES: RECLAMAR Y CERRAR
    if (interaction.isButton()) {
        if (interaction.customId === 'reclamar_ticket') {
            if (!interaction.member.roles.cache.has(ID_ROL_STAFF) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ content: '❌ Solo los miembros del Staff pueden reclamar este ticket.', ephemeral: true });
            }

            await interaction.reply({ content: `🙋‍♂️ El ticket ha sido reclamado por **${interaction.user.username}**. Él se encargará de tu asistencia.` });
            
            try {
                await interaction.channel.permissionOverwrites.edit(ID_ROL_STAFF, { SendMessages: false });
                await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, SendMessages: true });
            } catch (e) { console.error(e); }
            
            const botonDesactivado = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('reclamar_ticket').setLabel('Ticket Reclamado').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
            );
            await interaction.message.edit({ components: [botonDesactivado] });
        }

        if (interaction.customId === 'cerrar_ticket') {
            await interaction.reply({ content: '🔒 Cerrando el ticket de soporte en 5 segundos...' });
            setTimeout(async () => { 
                try { await interaction.channel.delete(); } catch(e){} 
            }, 5000);
        }

    }
});

client.on('error', console.error);

// COMANDO DE PRUEBA TEMPORAL
client.on('messageCreate', async (message) => {
    if (message.content === '!test' && !message.author.bot) {
        client.emit('guildMemberAdd', message.member);
    }
});

client.login(config.TOKEN);