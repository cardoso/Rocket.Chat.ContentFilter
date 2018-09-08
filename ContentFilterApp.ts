import {
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPreMessageSentPrevent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

export class ContentFilterApp extends App implements IPreMessageSentPrevent {
    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async checkPreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        return true;
    }

    public async executePreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean> {
        const regexes = (await read.getEnvironmentReader().getSettings().getValueById('Content_Filter_Regular_Expressions'))
                                   .replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(/\r/).filter((r: string) => r.length > 0);

        if (regexes.length === 0) {
            return false;
        }

        const fullContent = (message.text || '') + (message.avatarUrl || '') + (message.alias || '') + (message.emoji || '')
                            + (message.attachments || []).reduce((total, a) => {
                                return total + (a.audioUrl || '') + (a.description || '') + (a.imageUrl || '') + (a.text || '')
                                       + (a.thumbnailUrl || '') + (a.timestampLink || '') + ((a.title || {}).link || '')
                                       + ((a.title || {}).value || '') + (a.videoUrl || '')
                                       + (a.fields || []).reduce((t, f) => {
                                           return t + (f.title || '') + (f.value || '');
                                       }, '');
                            }, '');

        for (const r of regexes) {
            if (RegExp(r).exec(fullContent)) {
                read.getNotifier().notifyUser(message.sender, {
                    room: message.room,
                    sender: message.sender,
                    text: 'Your message has been blocked by *Content Filter*',
                    alias: 'Content Filter',
                    emoji: ':no_entry:',
                });

                return true;
            }
        }

        return false;
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await configuration.settings.provideSetting({
            id: 'Content_Filter_Regular_Expressions',
            type: SettingType.CODE,
            packageValue: '',
            required: true,
            public: false,
            i18nLabel: 'Content_Filter_Regular_Expressions',
            i18nDescription: 'Content_Filter_Regular_Expressions_Description',
        });
    }
}
