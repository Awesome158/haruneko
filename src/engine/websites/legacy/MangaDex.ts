// Auto-Generated export from HakuNeko Legacy
// See: https://gist.github.com/ronny1982/0c8d5d4f0bd9c1f1b21dbf9a2ffbfec9

//import { Tags } from '../../Tags';
import icon from './MangaDex.webp';
import { DecoratableMangaScraper } from '../../providers/MangaPlugin';

export default class extends DecoratableMangaScraper {

    public constructor() {
        super('mangadex', `MangaDex`, 'https://mangadex.org' /*, Tags.Language.English, Tags ... */);
    }

    public override get Icon() {
        return icon;
    }
}

// Original Source
/*
class MangaDex extends Connector {

    constructor() {
        super();
        super.id = 'mangadex';
        super.label = 'MangaDex';
        this.tags = [ 'manga', 'high-quality', 'multi-lingual' ];
        this.url = 'https://mangadex.org';
        this.api = 'https://api.mangadex.org';
        this.requestOptions.headers.set('x-referer', this.url);
        this.requestOptions.headers.set('x-sec-ch-ua', '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"');
        this.config = {
            throttleRequests: {
                label: 'Throttle API Requests [ms]',
                description: 'Enter the timespan in [ms] to delay consecuitive requests to the api.',
                input: 'numeric',
                min: 100,
                max: 10000,
                value: 2000
            },
            throttle: {
                label: 'Throttle Image Requests [ms]',
                description: 'Enter the timespan in [ms] to delay consecuitive HTTP requests.\nThe website may block images for to many consecuitive requests.',
                input: 'numeric',
                min: 50,
                max: 5000,
                value: 500
            }
        };
        this.licensedChapterGroups = [
            '4f1de6a2-f0c5-4ac5-bce5-02c7dbb67deb', // MangaPlus
            '8d8ecf83-8d42-4f8c-add8-60963f9f28d9' // Comikey
        ];
        this.serverNetwork = [
            'https://s2.mangadex.org/data/',
            'https://s5.mangadex.org/data/',
            'https://uploads.mangadex.org/data/'
        ];
    }

    async _initializeConnector() {
        //this.serverNetwork.push('https://reh3tgm2rs8sr.xnvda7fch4zhr.mangadex.network/data/');
        //this.serverNetwork.push('https://bddhaec337xvm.xnvda7fch4zhr.mangadex.network/data/');
        this.serverNetwork.push('https://cache.ayaya.red/mdah/data/');
        console.log(`Added Network Seeds '[ ${this.serverNetwork.join(', ')} ]' to ${this.label}`);
        const request = new Request(this.url, this.requestOptions);
        return Engine.Request.fetchUI(request, '');
    }

    canHandleURI(uri) {
        // See: https://www.reddit.com/r/mangadex/comments/nn584s/list_of_appssites_that_currently_use_the_mangadex/
        return [
            /https?:\/\/mangadex\.org\/title\//,
            /https?:\/\/mangastack\.cf\/manga\//,
            /https?:\/\/manga\.ayaya\.red\/manga\//,
            /https?:\/\/(www\.)?chibiview\.app\/manga\//,
            /https?:\/\/cubari\.moe\/read\/mangadex\//
        ].some(regex => regex.test(uri.href));
    }

    async _getMangaFromURI(uri) {
        // NOTE: The MangaDex website is still down, but there are some provisional frontends which can be used for search, copy & paste
        const regexGUID = /[a-fA-F0-9]{8}-([a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}/;
        const id = (uri.pathname.match(regexGUID) || uri.hash.match(regexGUID))[0].toLowerCase();
        const request = new Request(new URL('/manga/' + id, this.api), this.requestOptions);
        const {data} = await this.fetchJSON(request);
        return new Manga(this, id, data.attributes.title.en || Object.values(data.attributes.title).shift());
    }

    async _getMangas() {
        let mangaList = [];
        let first10k = await this._getMangasFromPages(0, 99);
        mangaList = [...mangaList, ...first10k.data];
        let nextAt = first10k.nextAt;

        for (let i = 1; i <= first10k.total / 10000; i += 1) {
            let first100of10k = await this._getMangasFromPages(0, 0, nextAt);
            mangaList = [...mangaList, ...first100of10k.data.slice(1)];
            let pages = Math.min(Math.floor(first100of10k.total / 100), 99);
            if (pages > 0) {
                let data = await this._getMangasFromPages(1, pages, nextAt);
                mangaList = [...mangaList, ...data.data];
                nextAt = data.nextAt;
            }
        }
        return mangaList.map(ele => {
            return {
                id: ele.id,
                title: (ele.attributes.title.en || Object.values(ele.attributes.title).shift()).trim()
            };
        });
    }

    async _getMangasFromPages(start, pages, nextAt) {
        let tmp = [];
        let data100;
        for (let page = start; page <= pages; page += 1) {
            const uri = new URL('/manga', this.api);
            uri.searchParams.set('limit', 100);
            uri.searchParams.set('offset', 100 * page);
            uri.searchParams.set('order[createdAt]', 'asc');
            uri.searchParams.append('contentRating[]', 'safe');
            uri.searchParams.append('contentRating[]', 'suggestive');
            uri.searchParams.append('contentRating[]', 'erotica');
            uri.searchParams.append('contentRating[]', 'pornographic');
            if (nextAt) uri.searchParams.set('createdAtSince', nextAt);
            const request = new Request(uri, this.requestOptions);
            data100 = await this.fetchJSON(request, 3);
            await this.wait(this.config.throttleRequests.value);
            tmp = [...tmp, ...data100.data];
        }
        return {
            data: tmp,
            nextAt: data100.data.pop().attributes.createdAt.replace('+00:00', ''),
            total: data100.total
        };
    }

    async _getChapters(manga) {
        let chapterList = [];
        for(let page = 0, run = true; run; page++) {
            let chapters = await this._getChaptersFromPage(manga, page);
            chapters.length > 0 ? chapterList.push(...chapters) : run = false;
        }
        return chapterList;
    }

    async _getChaptersFromPage(manga, page) {
        await this.wait(this.config.throttleRequests.value);
        const uri = new URL('/chapter', this.api);
        uri.searchParams.set('limit', 100);
        uri.searchParams.set('offset', 100 * page);
        uri.searchParams.append('contentRating[]', 'safe');
        uri.searchParams.append('contentRating[]', 'suggestive');
        uri.searchParams.append('contentRating[]', 'erotica');
        uri.searchParams.append('contentRating[]', 'pornographic');
        uri.searchParams.set('manga', manga.id);
        const request = new Request(uri, this.requestOptions);
        const {data} = await this.fetchJSON(request, 3);
        const groupMap = await this._getScanlationGroups(data);
        return !data ? [] : data.map(result => {
            let title = '';
            if(result.attributes.volume) {
                title += 'Vol.' + this._padNum(result.attributes.volume, 2);
            }
            if(result.attributes.chapter) {
                title += ' Ch.' + this._padNum(result.attributes.chapter, 4);
            }
            if(result.attributes.title) {
                title += (title ? ' - ' : '') + result.attributes.title;
            }
            if(result.attributes.translatedLanguage) {
                title += ' (' + result.attributes.translatedLanguage + ')';
            }
            const groups = result.relationships.filter(r => r.type === 'scanlation_group');
            if(groups.length > 0) {
                title += ' [' + groups.map(group => groupMap[group.id]).join(', ') + ']';
            }
            // is any group for this chapter not in the list of licensed groups?
            if(groups.length === 0 || groups.some(group => !this.licensedChapterGroups.includes(group.id))) {
                return {
                    id: result.id,
                    title: title.trim(),
                    language: result.attributes.translatedLanguage
                };
            } else {
                return false;
            }
        }).filter(chapter => chapter);
    }

    async _getPages(chapter) {
        const uri = new URL('/at-home/server/' + chapter.id, this.api);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchJSON(request, 3);
        return data.chapter.data.map(file => this.createConnectorURI({
            networkNode: data.baseUrl + '/data/', // e.g. 'https://foo.bar.mangadex.network:44300/token/data/'
            hash: data.chapter.hash, // e.g. '1c41e55e32b21321ff11907469e5c323'
            file: file // e.g. 'x1-216a1435.png'
        }));
    }

    async _handleConnectorURI(payload) {
        const servers = [
            ...this.serverNetwork,
            payload.networkNode
        ];
        for(let node of servers) {
            try {
                const uri = new URL(node + payload.hash + '/' + payload.file);
                const request = new Request(uri, this.requestOptions);
                const response = await fetch(request);
                if(response.ok && response.status === 200) {
                    const data = await response.blob();
                    if(response.headers.get('content-length') == data.size || await createImageBitmap(data)) {
                        return this._blobToBuffer(data);
                    }
                }
            } finally {/**}
        }
        throw new Error('Failed to download image file from MangaDex@Home network!\n' + payload.networkNode);
    }

    async _getScanlationGroups(chapters) {
        const groupList = {};
        let groupIDs = !chapters ? {} : chapters.reduce((accumulator, chapter) => {
            const ids = chapter.relationships.filter(r => r.type === 'scanlation_group').map(g => g.id);
            return accumulator.concat(ids);
        }, []);
        groupIDs = Array.from(new Set(groupIDs));
        if(groupIDs.length > 0) {
            await this.wait(this.config.throttleRequests.value);
            const uri = new URL('/group', this.api);
            uri.search = new URLSearchParams([ [ 'limit', 100 ], ...groupIDs.map(id => [ 'ids[]', id ]) ]).toString();
            const request = new Request(uri, this.requestOptions);
            const {data} = await this.fetchJSON(request, 3);
            data.forEach(result => groupList[result.id] = result.attributes.name || 'unknown');
        }
        return groupList;
    }

    _padNum(number, places) {
        /*
         * '17'
         * '17.5'
         * '17-17.5'
         * '17 - 17.5'
         * '17-123456789'
         *
        let range = number.split('-');
        range = range.map(chapter => {
            chapter = chapter.trim();
            let digits = chapter.split('.')[0].length;
            return '0'.repeat(Math.max(0, places - digits)) + chapter;
        });
        return range.join('-');
    }
}
*/