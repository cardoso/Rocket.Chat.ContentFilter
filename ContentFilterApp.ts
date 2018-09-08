import {
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IMessageExtender,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPreMessageSentPrevent, IPreMessageUpdatedExtend, IPreMessageUpdatedPrevent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { validateMessage } from './lib/validateMessage';

export class ContentFilterApp extends App implements IPreMessageSentPrevent, IPreMessageUpdatedPrevent, IPreMessageUpdatedExtend {
    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async checkPreMessageUpdatedExtend(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        return message.text === 'rick roll';
    }

    // tslint:disable-next-line:max-line-length
    public async executePreMessageUpdatedExtend(message: IMessage, extend: IMessageExtender, read: IRead, http: IHttp, persistence: IPersistence): Promise<IMessage> {
        return extend.addAttachment({
            videoUrl: 'https://archive.org/download/RickAstleyNeverGonnaGiveYouUp_201603/Rick%20Astley%20-%20Never%20Gonna%20Give%20You%20Up.mp4',
        }).getMessage();
    }

    public async checkPreMessageUpdatedPrevent(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        return message.text !== 'prevent prevent from being called';
    }

    public async executePreMessageUpdatedPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean> {
        if (await validateMessage(message, read)) {
            return false;
        }

        await read.getNotifier().notifyUser(message.sender, {
            room: message.room,
            sender: message.sender,
            text: 'Your message edit has been blocked by *Content Filter*',
            alias: 'Content Filter',
            emoji: ':no_entry:',
        });

        return true;
    }

    public async checkPreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        return true;
    }

    public async executePreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean> {
        if (await validateMessage(message, read)) {
            return false;
        }

        await read.getNotifier().notifyUser(message.sender, {
            room: message.room,
            sender: message.sender,
            text: 'Your message has been blocked by *Content Filter*',
            alias: 'Content Filter',
            emoji: ':no_entry:',
        });

        return true;
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
