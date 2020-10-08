import { deleteLocalStorageItems } from '../../utils';
import { decodeToken } from '../../jwt/jwt';
import omit from 'lodash/omit';
export const GLOBAL_FILTER_KEY = 'chrome:global-filter';

export const workloads = [
    {
        name: 'Workloads',
        noFilter: true,
        tags: [{
            tag: { key: 'All workloads' }
        },
        {
            tag: { key: 'SAP' }
        }],
        type: 'radio'
    }
];

export const selectWorkloads = () => ({
    [workloads?.[0]?.tags?.[0]?.tag?.key || 'All workloads']: {
        group: omit(workloads[0], 'tags'),
        isSelected: true,
        item: {}
    }
});

export const updateSelected = (original, namespace, key, value, isSelected) => ({
    ...original,
    [namespace]: {
        ...original?.[namespace],
        [key]: {
            ...original?.[namespace]?.[key],
            isSelected,
            value
        }
    }
});

export const storeFilter = (tags, token) => {
    deleteLocalStorageItems(Object.keys(localStorage).filter(key => key.startsWith(GLOBAL_FILTER_KEY)));
    const searchParams = new URLSearchParams();
    searchParams.append('workloads', Object.keys(tags?.Workloads || {})?.[0]);
    location.hash = searchParams.toString();
    localStorage.setItem(
        `${GLOBAL_FILTER_KEY}/${token}`,
        JSON.stringify(Object.entries(tags).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: {
                ...Object.entries(value || {})
                .reduce((
                    currValue,
                    // eslint-disable-next-line no-unused-vars
                    [itemKey, { item, value: tagValue, group: { items, ...group } = {}, ...rest }]
                ) => ({
                    ...currValue,
                    [itemKey]: { ...rest, item: { tagValue: item?.tagValue || tagValue }, group }
                }), {})
            }
        }), {}))
    );
};

export const generateFilter = async () => {
    const searchParams = new URLSearchParams(location.hash.substring(1));
    const currToken = decodeToken(await insights.chrome.auth.getToken())?.session_state;
    let data;
    try {
        data = JSON.parse(localStorage.getItem(`${GLOBAL_FILTER_KEY}/${currToken}`) || '{}');
    } catch (e) {
        data = {};
    }

    if (searchParams.get('workloads')) {
        const { tag } = workloads[0].tags.find(({ tag: { key } }) => key === searchParams.get('workloads')) || {};
        data.Workloads = tag?.key ? {
            [tag?.key]: {
                group: omit(workloads[0], 'tags'),
                isSelected: true,
                item: {}
            }
        } : data.Workloads;
    }

    return [data, currToken];
};