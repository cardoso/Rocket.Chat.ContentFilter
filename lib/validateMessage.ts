import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';

export async function validateMessage(message: IMessage, read: IRead): Promise<boolean> {
        const regexes = (await read.getEnvironmentReader().getSettings().getValueById('Content_Filter_Regular_Expressions'))
                                   .replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(/\r/).filter((r: string) => r.length > 0);

        if (regexes.length === 0) {
            return true;
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
                return false;
            }
        }

        return true;
}
