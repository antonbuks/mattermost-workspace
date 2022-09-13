// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable dot-notation */

import React from 'react';

import {ShallowWrapper} from 'enzyme';

import {shallowWithIntl} from 'tests/helpers/intl-test-helper';
import {testComponentForLineBreak} from 'tests/helpers/line_break_helpers';
import {testComponentForMarkdownHotkeys, makeSelectionEvent} from 'tests/helpers/markdown_hotkey_helpers.js';

import Constants, {ModalIdentifiers} from 'utils/constants';

import CreateComment, {CreateComment as CreateCommentClass, State, Props} from 'components/create_comment/create_comment';
import FileUpload from 'components/file_upload';
import FilePreview from 'components/file_preview';
import Textbox, {TextboxClass, TextboxElement} from 'components/textbox';
import {FilePreviewInfo} from 'components/file_preview/file_preview';

import {FileInfo} from '@mattermost/types/files';
import {Emoji} from '@mattermost/types/emojis';
import {Group} from '@mattermost/types/groups';
import {ChannelMemberCountByGroup, ChannelMemberCountsByGroup} from '@mattermost/types/channels';
import {ServerError} from '@mattermost/types/errors';

describe('components/CreateComment', () => {
    jest.useFakeTimers();
    let windowSpy: jest.SpyInstance;
    beforeEach(() => {
        windowSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(cb, 16));
    });

    afterEach(() => {
        windowSpy.mockRestore();
    });

    const channelId = 'g6139tbospd18cmxroesdk3kkc';
    const rootId = '';
    const latestPostId = '3498nv24823948v23m4nv34';

    const baseProps = {
        channelId,
        rootId,
        rootDeleted: false,
        channelMembersCount: 3,
        draft: {
            message: 'Test message',
            uploadsInProgress: [],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        },
        enableAddButton: true,
        ctrlSend: false,
        latestPostId,
        locale: 'en',
        clearCommentDraftUploads: jest.fn(),
        onUpdateCommentDraft: jest.fn(),
        updateCommentDraftWithRootId: jest.fn(),
        onSubmit: jest.fn(),
        onResetHistoryIndex: jest.fn(),
        onMoveHistoryIndexBack: jest.fn(),
        onMoveHistoryIndexForward: jest.fn(),
        onEditLatestPost: jest.fn(),
        resetCreatePostRequest: jest.fn(),
        setShowPreview: jest.fn(),
        emitShortcutReactToLastPostFrom: jest.fn(),
        groupsWithAllowReference: null,
        channelMemberCountsByGroup: {},
        markdownPreviewFeatureIsEnabled: false,
        shouldShowPreview: false,
        enableEmojiPicker: true,
        enableGifPicker: true,
        enableConfirmNotificationsToChannel: true,
        maxPostSize: Constants.DEFAULT_CHARACTER_LIMIT,
        rhsExpanded: false,
        badConnection: false,
        getChannelTimezones: jest.fn(() => Promise.resolve({data: []})),
        isTimezoneEnabled: false,
        selectedPostFocussedAt: 0,
        isMarkdownPreviewEnabled: true,
        canPost: true,
        useChannelMentions: true,
        getChannelMemberCountsByGroup: jest.fn(),
        useLDAPGroupMentions: true,
        useCustomGroupMentions: true,
        openModal: jest.fn(),
    };

    test('should match snapshot, empty comment', () => {
        const draft = {
            message: '',
            uploadsInProgress: [],
            fileInfos: [],
        };
        const enableAddButton = false;
        const ctrlSend = true;
        const props = {...baseProps, draft, enableAddButton, ctrlSend};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        expect(wrapper).toMatchSnapshot();
    });

    test('should match snapshot, comment with message', () => {
        const clearCommentDraftUploads = jest.fn();
        const onResetHistoryIndex = jest.fn();
        const getChannelMemberCountsByGroup = jest.fn();
        const draft = {
            message: 'Test message',
            uploadsInProgress: [],
            fileInfos: [],
        };
        const ctrlSend = true;
        const props = {...baseProps, ctrlSend, draft, clearCommentDraftUploads, onResetHistoryIndex, getChannelMemberCountsByGroup};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        // should clear draft uploads on mount
        expect(clearCommentDraftUploads).toHaveBeenCalled();

        // should reset message history index on mount
        expect(onResetHistoryIndex).toHaveBeenCalled();

        // should load channel member counts on mount
        expect(getChannelMemberCountsByGroup).toHaveBeenCalled();

        expect(wrapper).toMatchSnapshot();
    });

    test('should not call getChannelMemberCountsByGroup, without group mentions permission or license', () => {
        const useLDAPGroupMentions = false;
        const useCustomGroupMentions = false;

        const getChannelMemberCountsByGroup = jest.fn();
        const props = {...baseProps, useLDAPGroupMentions, useCustomGroupMentions, getChannelMemberCountsByGroup};

        shallowWithIntl(<CreateComment {...props}/>);

        // should not load channel member counts on mount without useGroupmentions
        expect(getChannelMemberCountsByGroup).not.toHaveBeenCalled();
    });

    test('should match snapshot, non-empty message and uploadsInProgress + fileInfos', () => {
        const draft = {
            message: 'Test message',
            uploadsInProgress: [{}],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        };

        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );

        wrapper.setState({draft});
        expect(wrapper).toMatchSnapshot();
    });

    test('should correctly change state when toggleEmojiPicker is called', () => {
        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );

        (wrapper.instance() as CreateCommentClass).toggleEmojiPicker();
        expect(wrapper.state('showEmojiPicker')).toBe(true);

        (wrapper.instance() as CreateCommentClass).toggleEmojiPicker();
        expect(wrapper.state('showEmojiPicker')).toBe(false);
    });

    test('should correctly change state when hideEmojiPicker is called', () => {
        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );

        (wrapper.instance() as CreateCommentClass).hideEmojiPicker();
        expect(wrapper.state('showEmojiPicker')).toBe(false);
    });

    test('should correctly update draft when handleEmojiClick is called', () => {
        const onUpdateCommentDraft = jest.fn();
        const draft = {
            message: '',
            uploadsInProgress: [],
            fileInfos: [],
        };
        const enableAddButton = false;
        const props = {...baseProps, draft, onUpdateCommentDraft, enableAddButton};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        const mockImpl = () => {
            return {
                setSelectionRange: jest.fn(),
                getBoundingClientRect: jest.fn(mockTop),
                focus: jest.fn(),
            };
        };

        const mockTop = () => {
            return document.createElement('div');
        };

        (wrapper.instance() as CreateCommentClass)['textboxRef'] = {
            current: {
                getInputBox: jest.fn(mockImpl),
                getBoundingClientRect: jest.fn(),
                focus: jest.fn(),
            } as unknown as TextboxClass,
        };

        (wrapper.instance() as CreateCommentClass).handleEmojiClick({name: 'smile'} as Emoji);
        expect(onUpdateCommentDraft).toHaveBeenCalled();

        // Empty message case
        expect(onUpdateCommentDraft.mock.calls[0][0]).toEqual(
            expect.objectContaining({message: ':smile: '}),
        );
        expect(wrapper.state<State['draft']>('draft')!.message).toBe(':smile: ');

        wrapper.setState({draft: {message: 'test', uploadsInProgress: [], fileInfos: []},
            caretPosition: 'test'.length, // cursor is at the end
        });
        (wrapper.instance() as CreateCommentClass).handleEmojiClick({name: 'smile'} as Emoji);

        // Message with no space at the end
        expect(onUpdateCommentDraft.mock.calls[1][0]).toEqual(
            expect.objectContaining({message: 'test :smile:  '}),
        );
        expect(wrapper.state<State['draft']>('draft')!.message).toBe('test :smile:  ');

        wrapper.setState({draft: {message: 'test ', uploadsInProgress: [], fileInfos: []},
            caretPosition: 'test '.length, // cursor is at the end
        });
        (wrapper.instance() as CreateCommentClass).handleEmojiClick({name: 'smile'} as Emoji);

        // Message with space at the end
        expect(onUpdateCommentDraft.mock.calls[2][0]).toEqual(
            expect.objectContaining({message: 'test  :smile:  '}),
        );
        expect(wrapper.state<State['draft']>('draft')!.message).toBe('test  :smile:  ');

        expect(wrapper.state('showEmojiPicker')).toBe(false);
    });

    test('handlePostError should update state with the correct error', () => {
        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );

        (wrapper.instance() as CreateCommentClass).handlePostError('test error 1');
        expect(wrapper.state('postError')).toBe('test error 1');

        (wrapper.instance() as CreateCommentClass).handlePostError('test error 2');
        expect(wrapper.state('postError')).toBe('test error 2');
    });

    test('handleUploadError should update state with the correct error', () => {
        const updateCommentDraftWithRootId = jest.fn();
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        };
        const props = {...baseProps, draft, updateCommentDraftWithRootId};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        const instance = wrapper.instance() as CreateCommentClass;

        const testError1 = 'test error 1';
        wrapper.setState({draft});
        instance['draftsForPost'][props.rootId] = draft;
        instance.handleUploadError(testError1, '1', undefined, props.rootId);

        expect(updateCommentDraftWithRootId).toHaveBeenCalled();
        expect(updateCommentDraftWithRootId.mock.calls[0][0]).toEqual(props.rootId);
        expect(updateCommentDraftWithRootId.mock.calls[0][1]).toEqual(
            expect.objectContaining({uploadsInProgress: ['2', '3']}),
        );
        expect(wrapper.state<State['serverError']>('serverError')!.message).toBe(testError1);
        expect(wrapper.state<State['draft']>('draft')!.uploadsInProgress).toEqual(['2', '3']);

        // clientId = -1
        const testError2 = 'test error 2';
        instance.handleUploadError(testError2, -1, undefined, props.rootId);

        // should not call onUpdateCommentDraft
        expect(updateCommentDraftWithRootId.mock.calls.length).toBe(1);
        expect(wrapper.state<State['serverError']>('serverError')!.message).toBe(testError2);
    });

    test('getFileCount should return the correct count', () => {
        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );

        expect((wrapper.instance() as CreateCommentClass).getFileCount()).toBe(3);

        wrapper.setState({draft: {message: 'test', uploadsInProgress: [{}], fileInfos: [{}, {}, {}]}});
        expect((wrapper.instance() as CreateCommentClass).getFileCount()).toBe(4);

        wrapper.setState({draft: {message: 'test', uploadsInProgress: [], fileInfos: []}});
        expect((wrapper.instance() as CreateCommentClass).getFileCount()).toBe(0);
    });

    test('should call openModal when showPostDeletedModal is called', () => {
        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );

        (wrapper.instance() as CreateCommentClass).showPostDeletedModal();

        expect(baseProps.openModal).toHaveBeenCalledTimes(1);
    });

    test('handleUploadStart should update comment draft correctly', () => {
        const onUpdateCommentDraft = jest.fn();
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        };
        const props = {...baseProps, onUpdateCommentDraft, draft};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        const focusTextbox = jest.fn();
        wrapper.setState({draft});
        (wrapper.instance() as CreateCommentClass).focusTextbox = focusTextbox;
        (wrapper.instance() as CreateCommentClass).handleUploadStart(['4', '5']);

        expect(onUpdateCommentDraft).toHaveBeenCalled();
        expect(onUpdateCommentDraft.mock.calls[0][0]).toEqual(
            expect.objectContaining({uploadsInProgress: ['1', '2', '3', '4', '5']}),
        );

        expect(wrapper.state<State['draft']>('draft')!.uploadsInProgress === ['1', '2', '3', '4', '5']);
        expect(focusTextbox).toHaveBeenCalled();
    });

    test('handleFileUploadComplete should update comment draft correctly', () => {
        const updateCommentDraftWithRootId = jest.fn();
        const fileInfos = [{id: '1', name: 'aaa', create_at: 100} as FileInfo, {id: '2', name: 'bbb', create_at: 200} as FileInfo];
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos,
        };
        const props = {...baseProps, updateCommentDraftWithRootId, draft};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        const instance = wrapper.instance() as CreateCommentClass;
        wrapper.setState({draft});
        instance['draftsForPost'][props.rootId] = draft;

        const uploadCompleteFileInfo = [{id: '3', name: 'ccc', create_at: 300} as FileInfo];
        const expectedNewFileInfos = fileInfos.concat(uploadCompleteFileInfo);
        instance.handleFileUploadComplete(uploadCompleteFileInfo, ['3'], '', props.rootId);
        expect(updateCommentDraftWithRootId).toHaveBeenCalled();
        expect(updateCommentDraftWithRootId.mock.calls[0][0]).toEqual(props.rootId);
        expect(updateCommentDraftWithRootId.mock.calls[0][1]).toEqual(
            expect.objectContaining({uploadsInProgress: ['1', '2'], fileInfos: expectedNewFileInfos}),
        );

        expect(wrapper.state<State['draft']>('draft')!.uploadsInProgress).toEqual(['1', '2']);
        expect(wrapper.state<State['draft']>('draft')!.fileInfos).toEqual(expectedNewFileInfos);
    });

    it('check for uploadsProgressPercent state on handleUploadProgress callback', () => {
        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );

        wrapper.find(FileUpload).prop('onUploadProgress')({clientId: 'clientId', name: 'name', percent: 10, type: 'type'} as unknown as FilePreviewInfo);
        expect(wrapper.find(FilePreview).prop('uploadsProgressPercent')).toEqual({clientId: {clientId: 'clientId', percent: 10, name: 'name', type: 'type'}});

        expect(wrapper.state('uploadsProgressPercent')).toEqual({clientId: {clientId: 'clientId', percent: 10, name: 'name', type: 'type'}});
    });

    test('should open PostDeletedModal when createPostErrorId === api.post.create_post.root_id.app_error', () => {
        const onUpdateCommentDraft = jest.fn();
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos: [{id: '1', name: 'aaa', create_at: 100} as FileInfo, {id: '2', name: 'bbb', create_at: 200} as FileInfo],
        };
        const props = {...baseProps, onUpdateCommentDraft, draft};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        wrapper.setProps({createPostErrorId: 'api.post.create_post.root_id.app_error'});

        expect(props.openModal).toHaveBeenCalledTimes(1);
        expect(props.openModal.mock.calls[0][0]).toMatchObject({
            modalId: ModalIdentifiers.POST_DELETED_MODAL,
        });
    });

    test('should open PostDeletedModal when message is submitted to deleted root', () => {
        const onUpdateCommentDraft = jest.fn();
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos: [{id: '1', name: 'aaa', create_at: 100} as FileInfo, {id: '2', name: 'bbb', create_at: 200} as FileInfo],
        };
        const props = {...baseProps, onUpdateCommentDraft, draft};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        wrapper.setProps({rootDeleted: true});
        (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault: jest.fn()} as unknown as React.FormEvent);

        expect(props.openModal).toHaveBeenCalledTimes(1);
        expect(props.openModal.mock.calls[0][0]).toMatchObject({
            modalId: ModalIdentifiers.POST_DELETED_MODAL,
        });
    });

    describe('focusTextbox', () => {
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos: [{id: '1', name: 'aaa', create_at: 100} as FileInfo, {id: '2', name: 'bbb', create_at: 200} as FileInfo],
        };

        it('is called when rootId changes', () => {
            const props = {...baseProps, draft};
            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );

            const focusTextbox = jest.fn();
            (wrapper.instance() as CreateCommentClass).focusTextbox = focusTextbox;

            const newProps = {
                ...props,
                rootId: 'testid123',
            };

            // Note that setProps doesn't actually trigger componentDidUpdate
            wrapper.setProps(newProps);
            // eslint-disable-next-line
            // @ts-ignore
            (wrapper.instance() as CreateCommentClass).componentDidUpdate(props, newProps);
            expect(focusTextbox).toHaveBeenCalled();
        });

        it('is called when selectPostFocussedAt changes', () => {
            const props = {...baseProps, draft, selectedPostFocussedAt: 1000};
            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );

            const focusTextbox = jest.fn();
            (wrapper.instance() as CreateCommentClass).focusTextbox = focusTextbox;

            const newProps = {
                ...props,
                selectedPostFocussedAt: 2000,
            };

            // Note that setProps doesn't actually trigger componentDidUpdate
            wrapper.setProps(newProps);
            // eslint-disable-next-line
            // @ts-ignore
            (wrapper.instance() as CreateCommentClass).componentDidUpdate(props, props);
            expect(focusTextbox).toHaveBeenCalled();
        });

        it('is not called when rootId and selectPostFocussedAt have not changed', () => {
            const props = {...baseProps, draft, selectedPostFocussedAt: 1000};
            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );

            const focusTextbox = jest.fn();
            (wrapper.instance() as CreateCommentClass).focusTextbox = focusTextbox;
            (wrapper.instance() as CreateCommentClass).handleBlur();

            // Note that setProps doesn't actually trigger componentDidUpdate
            wrapper.setProps(props);
            // eslint-disable-next-line
            // @ts-ignore
            (wrapper.instance() as CreateCommentClass).componentDidUpdate(props, props);
            expect(focusTextbox).not.toHaveBeenCalled();
        });
    });

    test('handleChange should update comment draft correctly', () => {
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        };
        const scrollToBottom = jest.fn();
        const props = {...baseProps, draft, scrollToBottom};

        const wrapper = shallowWithIntl(
            <CreateComment
                {...props}
            />,
        );

        const testMessage = 'new msg';
        (wrapper.instance() as CreateCommentClass).handleChange({target: {value: testMessage}} as unknown as React.ChangeEvent<TextboxElement>);

        // The callback won't we called until after a short delay
        expect(baseProps.onUpdateCommentDraft).not.toHaveBeenCalled();

        jest.runOnlyPendingTimers();

        expect(baseProps.onUpdateCommentDraft).toHaveBeenCalled();
        expect(baseProps.onUpdateCommentDraft.mock.calls[0][0]).toEqual(
            expect.objectContaining({message: testMessage}),
        );
        expect(wrapper.state<State['draft']>('draft')!.message).toBe(testMessage);
        expect(scrollToBottom).toHaveBeenCalled();
    });

    it('handleChange should throw away invalid command error if user resumes typing', async () => {
        const onUpdateCommentDraft = jest.fn();

        const error = new Error('No command found') as unknown as ServerError;
        error.server_error_id = 'api.command.execute_command.not_found.app_error';
        const onSubmit = jest.fn(() => Promise.reject(error));

        const draft = {
            message: '/fakecommand other text',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        };
        const props = {...baseProps, onUpdateCommentDraft, draft, onSubmit};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        await (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault: jest.fn()} as unknown as React.FormEvent);

        expect(onSubmit).toHaveBeenCalledWith({
            message: '/fakecommand other text',
            uploadsInProgress: [],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        }, {ignoreSlash: false});

        (wrapper.instance() as CreateCommentClass).handleChange({
            target: {value: 'some valid text'},
        } as unknown as React.ChangeEvent<TextboxElement>);

        (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault: jest.fn()} as unknown as React.FormEvent);

        expect(onSubmit).toHaveBeenCalledWith({
            message: 'some valid text',
            uploadsInProgress: [],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        }, {ignoreSlash: false});
    });

    test('should scroll to bottom when uploadsInProgress increase', () => {
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['1', '2', '3'],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        };
        const scrollToBottom = jest.fn();
        const props = {...baseProps, draft, scrollToBottom};

        const wrapper = shallowWithIntl(
            <CreateComment
                {...props}
            />,
        );

        wrapper.setState({draft: {...draft, uploadsInProgress: [1, 2, 3, 4]}});
        expect(scrollToBottom).toHaveBeenCalled();
    });

    test('handleSubmit should call onSubmit prop', () => {
        const onSubmit = jest.fn();
        const draft = {
            message: 'Test message',
            uploadsInProgress: [],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        };
        const props = {...baseProps, draft, onSubmit};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        const preventDefault = jest.fn();
        (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
        expect(onSubmit).toHaveBeenCalled();
        expect(preventDefault).toHaveBeenCalled();
    });

    describe('handleSubmit', () => {
        let onSubmit: jest.Mock;
        let preventDefault: jest.Mock;

        beforeEach(() => {
            onSubmit = jest.fn();
            preventDefault = jest.fn();
        });

        ['channel', 'all', 'here'].forEach((mention) => {
            describe(`should not show Confirm Modal for @${mention} mentions`, () => {
                it('when channel member count too low', () => {
                    const props = {
                        ...baseProps,
                        draft: {
                            message: `Test message @${mention}`,
                            uploadsInProgress: [],
                            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                        },
                        onSubmit,
                        channelMembersCount: 1,
                        enableConfirmNotificationsToChannel: true,
                    };

                    const wrapper = shallowWithIntl(
                        <CreateComment {...props}/>,
                    );

                    (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                    expect(onSubmit).toHaveBeenCalled();
                    expect(preventDefault).toHaveBeenCalled();
                    expect(props.openModal).not.toHaveBeenCalled();
                });

                it('when feature disabled', () => {
                    const props = {
                        ...baseProps,
                        draft: {
                            message: `Test message @${mention}`,
                            uploadsInProgress: [],
                            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                        },
                        onSubmit,
                        channelMembersCount: 8,
                        enableConfirmNotificationsToChannel: false,
                    };

                    const wrapper = shallowWithIntl(
                        <CreateComment {...props}/>,
                    );

                    (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                    expect(onSubmit).toHaveBeenCalled();
                    expect(preventDefault).toHaveBeenCalled();
                    expect(props.openModal).not.toHaveBeenCalled();
                });

                it('when no mention', () => {
                    const props = {
                        ...baseProps,
                        draft: {
                            message: `Test message ${mention}`,
                            uploadsInProgress: [],
                            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                        },
                        onSubmit,
                        channelMembersCount: 8,
                        enableConfirmNotificationsToChannel: true,
                    };

                    const wrapper = shallowWithIntl(
                        <CreateComment {...props}/>,
                    );

                    (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                    expect(onSubmit).toHaveBeenCalled();
                    expect(preventDefault).toHaveBeenCalled();
                    expect(props.openModal).not.toHaveBeenCalled();
                });

                it('when user has insufficient permissions', () => {
                    const props = {
                        ...baseProps,
                        useChannelMentions: false,
                        draft: {
                            message: `Test message @${mention}`,
                            uploadsInProgress: [],
                            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                        },
                        onSubmit,
                        channelMembersCount: 8,
                        enableConfirmNotificationsToChannel: true,
                    };

                    const wrapper = shallowWithIntl(
                        <CreateComment {...props}/>,
                    );

                    (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                    expect(onSubmit).toHaveBeenCalled();
                    expect(preventDefault).toHaveBeenCalled();
                    expect(props.openModal).not.toHaveBeenCalled();
                });
            });

            it(`should show Confirm Modal for @${mention} mentions when needed`, () => {
                const props = {
                    ...baseProps,
                    draft: {
                        message: `Test message @${mention}`,
                        uploadsInProgress: [],
                        fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                    },
                    onSubmit,
                    channelMembersCount: 8,
                    enableConfirmNotificationsToChannel: true,
                };

                const wrapper = shallowWithIntl(
                    <CreateComment {...props}/>,
                );

                (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                expect(onSubmit).not.toHaveBeenCalled();
                expect(preventDefault).toHaveBeenCalled();
                expect(props.openModal).toHaveBeenCalled();
            });

            it(`should show Confirm Modal for @${mention} mentions when needed and timezone notification`, async () => {
                const props = {
                    ...baseProps,
                    draft: {
                        message: `Test message @${mention}`,
                        uploadsInProgress: [],
                        fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                    },
                    onSubmit,
                    isTimezoneEnabled: true,
                    channelMembersCount: 8,
                    enableConfirmNotificationsToChannel: true,
                };

                const wrapper = shallowWithIntl(
                    <CreateComment {...props}/>,
                );

                await (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                wrapper.setState({channelTimezoneCount: 4});

                expect(onSubmit).not.toHaveBeenCalled();
                expect(preventDefault).toHaveBeenCalled();
                expect(wrapper.state('channelTimezoneCount')).toBe(4);
                expect(baseProps.getChannelTimezones).toHaveBeenCalledTimes(1);
                expect(props.openModal).toHaveBeenCalled();
            });

            it(`should show Confirm Modal for @${mention} mentions when needed and no timezone notification`, async () => {
                const props = {
                    ...baseProps,
                    draft: {
                        message: `Test message @${mention}`,
                        uploadsInProgress: [],
                        fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                    },
                    onSubmit,
                    isTimezoneEnabled: true,
                    channelMembersCount: 8,
                    enableConfirmNotificationsToChannel: true,
                };

                const wrapper = shallowWithIntl(
                    <CreateComment {...props}/>,
                );

                await (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                wrapper.setState({channelTimezoneCount: 0});

                expect(onSubmit).not.toHaveBeenCalled();
                expect(preventDefault).toHaveBeenCalled();
                expect(wrapper.state('channelTimezoneCount')).toBe(0);
                expect(baseProps.getChannelTimezones).toHaveBeenCalledTimes(1);
                expect(props.openModal).toHaveBeenCalled();
            });
        });

        it('should show Confirm Modal for @group mention when needed and no timezone notification', async () => {
            const props = {
                ...baseProps,
                draft: {
                    message: 'Test message @developers',
                    uploadsInProgress: [],
                    fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                },
                groupsWithAllowReference: new Map([
                    ['@developers', {
                        id: 'developers',
                        name: 'developers',
                    } as Group],
                ]),
                channelMemberCountsByGroup: {
                    developers: {
                        channel_member_count: 10,
                        channel_member_timezones_count: 0,
                    } as ChannelMemberCountByGroup,
                } as ChannelMemberCountsByGroup,
                isTimezoneEnabled: false,
                channelMembersCount: 8,
                useChannelMentions: true,
                enableConfirmNotificationsToChannel: true,
            };

            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );
            const showNotifyAllModal = (wrapper.instance() as CreateCommentClass).showNotifyAllModal;
            (wrapper.instance() as CreateCommentClass).showNotifyAllModal = jest.fn((mentions, channelTimezoneCount, memberNotifyCount) => showNotifyAllModal(mentions, channelTimezoneCount, memberNotifyCount));

            await (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);

            expect(onSubmit).not.toHaveBeenCalled();
            expect(preventDefault).toHaveBeenCalled();
            expect(baseProps.getChannelTimezones).toHaveBeenCalledTimes(0);
            expect((wrapper.instance() as CreateCommentClass).showNotifyAllModal).toHaveBeenCalledWith(['@developers'], 0, 10);
            expect(props.openModal).toHaveBeenCalled();
        });

        it('should show Confirm Modal for @group mentions when needed and no timezone notification', async () => {
            const props = {
                ...baseProps,
                draft: {
                    message: 'Test message @developers @boss @love @you @software-developers',
                    uploadsInProgress: [],
                    fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                },
                groupsWithAllowReference: new Map([
                    ['@developers', {
                        id: 'developers',
                        name: 'developers',
                    } as Group],
                    ['@boss', {
                        id: 'boss',
                        name: 'boss',
                    } as Group],
                    ['@love', {
                        id: 'love',
                        name: 'love',
                    } as Group],
                    ['@you', {
                        id: 'you',
                        name: 'you',
                    } as Group],
                    ['@software-developers', {
                        id: 'softwareDevelopers',
                        name: 'software-developers',
                    } as Group],
                ]),
                channelMemberCountsByGroup: {
                    developers: {
                        channel_member_count: 10,
                        channel_member_timezones_count: 0,
                    } as ChannelMemberCountByGroup,
                    boss: {
                        channel_member_count: 20,
                        channel_member_timezones_count: 0,
                    } as ChannelMemberCountByGroup,
                    love: {
                        channel_member_count: 30,
                        channel_member_timezones_count: 0,
                    } as ChannelMemberCountByGroup,
                    you: {
                        channel_member_count: 40,
                        channel_member_timezones_count: 0,
                    } as ChannelMemberCountByGroup,
                    softwareDevelopers: {
                        channel_member_count: 5,
                        channel_member_timezones_count: 0,
                    } as ChannelMemberCountByGroup,
                } as ChannelMemberCountsByGroup,
                isTimezoneEnabled: false,
                channelMembersCount: 8,
                useChannelMentions: true,
                enableConfirmNotificationsToChannel: true,
            };

            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );

            const showNotifyAllModal = (wrapper.instance() as CreateCommentClass).showNotifyAllModal;
            (wrapper.instance() as CreateCommentClass).showNotifyAllModal = jest.fn((mentions, channelTimezoneCount, memberNotifyCount) => showNotifyAllModal(mentions, channelTimezoneCount, memberNotifyCount));

            await (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);

            expect(onSubmit).not.toHaveBeenCalled();
            expect(preventDefault).toHaveBeenCalled();
            expect(baseProps.getChannelTimezones).toHaveBeenCalledTimes(0);
            expect((wrapper.instance() as CreateCommentClass).showNotifyAllModal).toHaveBeenCalledWith(['@developers', '@boss', '@love', '@you', '@software-developers'], 0, 40);
            expect(props.openModal).toHaveBeenCalled();
        });

        it('should show Confirm Modal for @group mention with timezone enabled', async () => {
            const props = {
                ...baseProps,
                draft: {
                    message: 'Test message @developers',
                    uploadsInProgress: [],
                    fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                },
                groupsWithAllowReference: new Map([
                    ['@developers', {
                        id: 'developers',
                        name: 'developers',
                    } as Group],
                ]),
                channelMemberCountsByGroup: {
                    developers: {
                        channel_member_count: 10,
                        channel_member_timezones_count: 5,
                    } as ChannelMemberCountByGroup,
                } as ChannelMemberCountsByGroup,
                isTimezoneEnabled: true,
                channelMembersCount: 8,
                useChannelMentions: true,
                enableConfirmNotificationsToChannel: true,
            };

            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );

            const showNotifyAllModal = (wrapper.instance() as CreateCommentClass).showNotifyAllModal;
            (wrapper.instance() as CreateCommentClass).showNotifyAllModal = jest.fn((mentions, channelTimezoneCount, memberNotifyCount) => showNotifyAllModal(mentions, channelTimezoneCount, memberNotifyCount));

            await (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);

            expect(onSubmit).not.toHaveBeenCalled();
            expect(preventDefault).toHaveBeenCalled();
            expect(baseProps.getChannelTimezones).toHaveBeenCalledTimes(0);
            expect((wrapper.instance() as CreateCommentClass).showNotifyAllModal).toHaveBeenCalledWith(['@developers'], 5, 10);
            expect(props.openModal).toHaveBeenCalled();
        });

        it('should allow to force send invalid slash command as a message', async () => {
            const error = new Error('No command found') as unknown as ServerError;
            error.server_error_id = 'api.command.execute_command.not_found.app_error';
            const onSubmitWithError = jest.fn(() => Promise.reject(error));

            const props = {
                ...baseProps,
                draft: {
                    message: '/fakecommand other text',
                    uploadsInProgress: [],
                    fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                },
                onSubmit: onSubmitWithError,
            };

            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );

            await (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);

            expect(onSubmitWithError).toHaveBeenCalledWith({
                message: '/fakecommand other text',
                uploadsInProgress: [],
                fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
            }, {ignoreSlash: false});
            expect(preventDefault).toHaveBeenCalled();

            wrapper.setProps({onSubmit});
            await (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);

            expect(onSubmit).toHaveBeenCalledWith({
                message: '/fakecommand other text',
                uploadsInProgress: [],
                fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
            }, {ignoreSlash: true});
            expect(wrapper.find('[id="postServerError"]').exists()).toBe(false);
        });

        it('should update global draft state if invalid slash command error occurs', async () => {
            const error = new Error('No command found') as unknown as ServerError;
            error.server_error_id = 'api.command.execute_command.not_found.app_error';
            const onSubmitWithError = jest.fn(() => Promise.reject(error));

            const props = {
                ...baseProps,
                draft: {
                    message: '/fakecommand other text',
                    uploadsInProgress: [],
                    fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                },
                onSubmit: onSubmitWithError,
            };

            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );

            const submitPromise = (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
            expect(props.onUpdateCommentDraft).not.toHaveBeenCalled();

            await submitPromise;
            expect(props.onUpdateCommentDraft).toHaveBeenCalledWith(props.draft);
        });
        ['channel', 'all', 'here'].forEach((mention) => {
            it(`should set mentionHighlightDisabled when user does not have permission and message contains channel @${mention}`, async () => {
                const props = {
                    ...baseProps,
                    useChannelMentions: false,
                    enableConfirmNotificationsToChannel: false,
                    draft: {
                        message: `Test message @${mention}`,
                        uploadsInProgress: [],
                        fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                    },
                    onSubmit,
                };

                const wrapper = shallowWithIntl(
                    <CreateComment {...props}/>,
                );

                (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                expect(onSubmit).toHaveBeenCalled();
                expect(wrapper.state<State['draft']>('draft')!.props.mentionHighlightDisabled).toBe(true);
            });

            it(`should not set mentionHighlightDisabled when user does have permission and message contains channel channel @${mention}`, async () => {
                const props = {
                    ...baseProps,
                    useChannelMentions: true,
                    enableConfirmNotificationsToChannel: false,
                    draft: {
                        message: `Test message @${mention}`,
                        uploadsInProgress: [],
                        fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                    },
                    onSubmit,
                };

                const wrapper = shallowWithIntl(
                    <CreateComment {...props}/>,
                );

                (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
                expect(onSubmit).toHaveBeenCalled();
                expect(wrapper.state<State['draft']>('draft')!.props).toBe(undefined);
            });
        });

        it('should not set mentionHighlightDisabled when user does not have useChannelMentions permission and message contains no mention', async () => {
            const props = {
                ...baseProps,
                useChannelMentions: false,
                draft: {
                    message: 'Test message',
                    uploadsInProgress: [],
                    fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
                },
                onSubmit,
            };

            const wrapper = shallowWithIntl(
                <CreateComment {...props}/>,
            );

            (wrapper.instance() as CreateCommentClass).handleSubmit({preventDefault} as unknown as React.FormEvent);
            expect(onSubmit).toHaveBeenCalled();
            expect(wrapper.state<State['draft']>('draft')!.props).toBe(undefined);
        });
    });

    test('removePreview should remove file info and upload in progress with corresponding id', () => {
        const onUpdateCommentDraft = jest.fn();
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['4', '5', '6'],
            fileInfos: [{id: '1'} as FileInfo, {id: '2'} as FileInfo, {id: '3'} as FileInfo],
        };
        const props = {...baseProps, draft, onUpdateCommentDraft};

        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        wrapper.setState({draft});

        (wrapper.instance() as CreateCommentClass).removePreview('3');
        expect(onUpdateCommentDraft).toHaveBeenCalled();
        expect(onUpdateCommentDraft.mock.calls[0][0]).toEqual(
            expect.objectContaining({fileInfos: [{id: '1'}, {id: '2'}]}),
        );
        expect(wrapper.state<State['draft']>('draft')!.fileInfos).toEqual([{id: '1'}, {id: '2'}]);

        (wrapper.instance() as CreateCommentClass).removePreview('5');
        expect(onUpdateCommentDraft.mock.calls[1][0]).toEqual(
            expect.objectContaining({uploadsInProgress: ['4', '6']}),
        );
        expect(wrapper.state<State['draft']>('draft')!.uploadsInProgress).toEqual(['4', '6']);
    });

    test('should match draft state on componentWillReceiveProps with change in messageInHistory', () => {
        const draft = {
            message: 'Test message',
            uploadsInProgress: [],
            fileInfos: [{} as FileInfo, {} as FileInfo, {} as FileInfo],
        };

        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );
        expect(wrapper.state<State['draft']>('draft'))!.toEqual(draft);

        const newDraft = {...draft, message: 'Test message edited'};
        wrapper.setProps({draft: newDraft, messageInHistory: 'Test message edited'});
        expect(wrapper.state<State['draft']>('draft'))!.toEqual(newDraft);
    });

    test('should match draft state on componentWillReceiveProps with new rootId', () => {
        const draft = {
            message: 'Test message',
            uploadsInProgress: ['4', '5', '6'],
            fileInfos: [{id: '1'}, {id: '2'}, {id: '3'}],
        };

        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );
        wrapper.setState({draft});
        expect(wrapper.state<State['draft']>('draft'))!.toEqual(draft);

        wrapper.setProps({rootId: 'new_root_id'});
        expect(wrapper.state<State['draft']>('draft'))!.toEqual({...draft, uploadsInProgress: [], fileInfos: [{}, {}, {}]});
    });

    test('should match snapshot when cannot post', () => {
        const props = {...baseProps, canPost: false};
        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        expect(wrapper).toMatchSnapshot();
    });

    test('should match snapshot, emoji picker disabled', () => {
        const props = {...baseProps, enableEmojiPicker: false};
        const wrapper = shallowWithIntl(
            <CreateComment {...props}/>,
        );

        expect(wrapper).toMatchSnapshot();
    });

    test('check for handleFileUploadChange callback for focus', () => {
        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );
        const instance = wrapper.instance() as CreateCommentClass;
        instance.focusTextbox = jest.fn();

        instance.handleFileUploadChange();
        expect(instance.focusTextbox).toHaveBeenCalledTimes(1);
    });

    test('should call functions on handleKeyDown', () => {
        const onMoveHistoryIndexBack = jest.fn();
        const onMoveHistoryIndexForward = jest.fn();
        const onEditLatestPost = jest.fn().
            mockImplementationOnce(() => ({data: true})).
            mockImplementationOnce(() => ({data: false}));
        const wrapper = shallowWithIntl(
            <CreateComment
                {...baseProps}
                ctrlSend={true}
                onMoveHistoryIndexBack={onMoveHistoryIndexBack}
                onMoveHistoryIndexForward={onMoveHistoryIndexForward}
                onEditLatestPost={onEditLatestPost}
            />,
        );
        const instance = wrapper.instance() as CreateCommentClass;
        instance.commentMsgKeyPress = jest.fn();
        instance.focusTextbox = jest.fn();
        const blur = jest.fn();

        const mockImpl = () => {
            return {
                setSelectionRange: jest.fn(),
                getBoundingClientRect: jest.fn(mockTop),
                blur: jest.fn(),
                focus: jest.fn(),
            };
        };

        const mockTop = () => {
            return document.createElement('div');
        };

        instance['textboxRef'] = {
            current: {
                getInputBox: jest.fn(mockImpl),
                blur,
                focus,
            } as unknown as TextboxClass,
        };

        const mockTarget = {
            selectionStart: 0,
            selectionEnd: 0,
            value: 'brown\nfox jumps over lazy dog',
        };

        const commentMsgKey = {
            preventDefault: jest.fn(),
            ctrlKey: true,
            key: Constants.KeyCodes.ENTER[0],
            keyCode: Constants.KeyCodes.ENTER[1],
            target: mockTarget,
        } as unknown as React.KeyboardEvent<TextboxElement>;
        instance.handleKeyDown(commentMsgKey);
        expect(instance.commentMsgKeyPress).toHaveBeenCalledTimes(1);

        const upKey = {
            preventDefault: jest.fn(),
            ctrlKey: true,
            key: Constants.KeyCodes.UP[0],
            keyCode: Constants.KeyCodes.UP[1],
            target: mockTarget,
        } as unknown as React.KeyboardEvent<TextboxElement>;
        instance.handleKeyDown(upKey);
        expect(upKey.preventDefault).toHaveBeenCalledTimes(1);
        expect(onMoveHistoryIndexBack).toHaveBeenCalledTimes(1);

        const downKey = {
            preventDefault: jest.fn(),
            ctrlKey: true,
            key: Constants.KeyCodes.DOWN[0],
            keyCode: Constants.KeyCodes.DOWN[1],
            target: mockTarget,
        } as unknown as React.KeyboardEvent<TextboxElement>;
        instance.handleKeyDown(downKey);
        expect(downKey.preventDefault).toHaveBeenCalledTimes(1);
        expect(onMoveHistoryIndexForward).toHaveBeenCalledTimes(1);

        wrapper.setState({draft: {message: '', fileInfos: [], uploadsInProgress: []}});
        const upKeyForEdit = {
            preventDefault: jest.fn(),
            ctrlKey: false,
            key: Constants.KeyCodes.UP[0],
            keyCode: Constants.KeyCodes.UP[1],
            target: mockTarget,
        } as unknown as React.KeyboardEvent<TextboxElement>;
        instance.handleKeyDown(upKeyForEdit);
        expect(upKeyForEdit.preventDefault).toHaveBeenCalledTimes(1);
        expect(onEditLatestPost).toHaveBeenCalledTimes(1);
        expect(blur).toHaveBeenCalledTimes(1);

        instance.handleKeyDown(upKeyForEdit);
        expect(upKeyForEdit.preventDefault).toHaveBeenCalledTimes(2);
        expect(onEditLatestPost).toHaveBeenCalledTimes(2);
        expect(instance.focusTextbox).toHaveBeenCalledTimes(1);
        expect(instance.focusTextbox).toHaveBeenCalledWith(true);
    });

    test('should the RHS thread scroll to bottom one time after mount when props.draft.message is not empty', () => {
        const draft = {
            message: '',
            uploadsInProgress: [],
            fileInfos: [],
        };

        const scrollToBottom = jest.fn();
        const wrapper = shallowWithIntl(
            <CreateComment
                {...baseProps}
                scrollToBottom={scrollToBottom}
            />,
        );

        expect(scrollToBottom).toBeCalledTimes(0);
        expect((wrapper.instance() as CreateCommentClass)['doInitialScrollToBottom']).toEqual(true);

        // should scroll to bottom on first component update
        wrapper.setState({draft: {...draft, message: 'new message'}});
        expect(scrollToBottom).toBeCalledTimes(1);
        expect((wrapper.instance() as CreateCommentClass)['doInitialScrollToBottom']).toEqual(false);

        // but not after the first update
        wrapper.setState({draft: {...draft, message: 'another message'}});
        expect(scrollToBottom).toBeCalledTimes(1);
        expect((wrapper.instance() as CreateCommentClass)['doInitialScrollToBottom']).toEqual(false);
    });

    test('should the RHS thread scroll to bottom when state.draft.uploadsInProgress increases but not when it decreases', () => {
        const draft = {
            message: '',
            uploadsInProgress: [],
            fileInfos: [],
        };

        const scrollToBottom = jest.fn();
        const wrapper = shallowWithIntl(
            <CreateComment
                {...baseProps}
                draft={draft}
                scrollToBottom={scrollToBottom}
            />,
        );

        expect(scrollToBottom).toBeCalledTimes(0);

        wrapper.setState({draft: {...draft, uploadsInProgress: [1]}});
        expect(scrollToBottom).toBeCalledTimes(1);

        wrapper.setState({draft: {...draft, uploadsInProgress: [1, 2]}});
        expect(scrollToBottom).toBeCalledTimes(2);

        wrapper.setState({draft: {...draft, uploadsInProgress: [2]}});
        expect(scrollToBottom).toBeCalledTimes(2);
    });

    it('should be able to format a pasted markdown table', () => {
        const draft = {
            message: '',
            uploadsInProgress: [],
            fileInfos: [],
        };

        const wrapper = shallowWithIntl(
            <CreateComment
                {...baseProps}
                draft={draft}
            />,
        );

        const mockTop = () => {
            return document.createElement('div');
        };

        const mockImpl = () => {
            return {
                setSelectionRange: jest.fn(),
                getBoundingClientRect: jest.fn(mockTop),
                focus: jest.fn(),
            };
        };

        (wrapper.instance() as CreateCommentClass)['textboxRef'] = {
            current: {
                getInputBox: jest.fn(mockImpl),
                focus: jest.fn(),
                blur: jest.fn(),
            } as unknown as TextboxClass,
        };
        const event = {
            target: {
                id: 'reply_textbox',
            },
            preventDefault: jest.fn(),
            clipboardData: {
                items: [1],
                types: ['text/html'],
                getData: () => {
                    return '<table><tr><td>test</td><td>test</td></tr><tr><td>test</td><td>test</td></tr></table>';
                },
            },
        } as unknown as ClipboardEvent;

        const markdownTable = '|test | test|\n|--- | ---|\n|test | test|\n';

        (wrapper.instance() as CreateCommentClass).pasteHandler(event);
        expect(wrapper.state<State['draft']>('draft')!.message).toBe(markdownTable);
    });

    it('should be able to format a github codeblock (pasted as a table)', () => {
        const draft = {
            message: '',
            uploadsInProgress: [],
            fileInfos: [],
        };

        const wrapper = shallowWithIntl(
            <CreateComment
                {...baseProps}
                draft={draft}
            />,
        );

        const mockTop = () => {
            return document.createElement('div');
        };

        const mockImpl = () => {
            return {
                setSelectionRange: jest.fn(),
                getBoundingClientRect: jest.fn(mockTop),
                focus: jest.fn(),
            };
        };

        (wrapper.instance() as CreateCommentClass)['textboxRef'] = {
            current: {
                getInputBox: jest.fn(mockImpl),
                focus: jest.fn(),
                blur: jest.fn(),
            } as unknown as TextboxClass,
        };

        const event = {
            target: {
                id: 'reply_textbox',
            },
            preventDefault: jest.fn(),
            clipboardData: {
                items: [1],
                types: ['text/plain', 'text/html'],
                getData: (type: string) => {
                    if (type === 'text/plain') {
                        return '// a javascript codeblock example\nif (1 > 0) {\n  return \'condition is true\';\n}';
                    }
                    return '<table class="highlight tab-size js-file-line-container" data-tab-size="8"><tbody><tr><td id="LC1" class="blob-code blob-code-inner js-file-line"><span class="pl-c"><span class="pl-c">//</span> a javascript codeblock example</span></td></tr><tr><td id="L2" class="blob-num js-line-number" data-line-number="2">&nbsp;</td><td id="LC2" class="blob-code blob-code-inner js-file-line"><span class="pl-k">if</span> (<span class="pl-c1">1</span> <span class="pl-k">&gt;</span> <span class="pl-c1">0</span>) {</td></tr><tr><td id="L3" class="blob-num js-line-number" data-line-number="3">&nbsp;</td><td id="LC3" class="blob-code blob-code-inner js-file-line"><span class="pl-en">console</span>.<span class="pl-c1">log</span>(<span class="pl-s"><span class="pl-pds">\'</span>condition is true<span class="pl-pds">\'</span></span>);</td></tr><tr><td id="L4" class="blob-num js-line-number" data-line-number="4">&nbsp;</td><td id="LC4" class="blob-code blob-code-inner js-file-line">}</td></tr></tbody></table>';
                },
            },
        } as unknown as ClipboardEvent;

        const codeBlockMarkdown = "```\n// a javascript codeblock example\nif (1 > 0) {\n  return 'condition is true';\n}\n```";

        (wrapper.instance() as CreateCommentClass).pasteHandler(event);
        expect(wrapper.state<State['draft']>('draft')!.message).toBe(codeBlockMarkdown);
    });

    it('should be able to format a github codeblock (pasted as a table) with existing draft post', () => {
        const draft = {
            message: '',
            uploadsInProgress: [],
            fileInfos: [],
        };

        const wrapper = shallowWithIntl(
            <CreateComment
                {...baseProps}
                draft={draft}
            />,
        );

        const mockTop = () => {
            return document.createElement('div');
        };

        const mockImpl = () => {
            return {
                setSelectionRange: jest.fn(),
                getBoundingClientRect: jest.fn(mockTop),
                focus: jest.fn(),
            };
        };

        (wrapper.instance() as CreateCommentClass)['textboxRef'] = {
            current: {
                getInputBox: jest.fn(mockImpl),
                focus: jest.fn(),
                getBoundingClientRect: jest.fn(),
            } as unknown as TextboxClass,
        };
        wrapper.setState({
            draft: {
                ...draft,
                message: 'test',
            },
            caretPosition: 'test'.length, // cursor is at the end
        });

        const event = {
            target: {
                id: 'reply_textbox',
            },
            preventDefault: jest.fn(),
            clipboardData: {
                items: [1],
                types: ['text/plain', 'text/html'],
                getData: (type: string) => {
                    if (type === 'text/plain') {
                        return '// a javascript codeblock example\nif (1 > 0) {\n  return \'condition is true\';\n}';
                    }
                    return '<table class="highlight tab-size js-file-line-container" data-tab-size="8"><tbody><tr><td id="LC1" class="blob-code blob-code-inner js-file-line"><span class="pl-c"><span class="pl-c">//</span> a javascript codeblock example</span></td></tr><tr><td id="L2" class="blob-num js-line-number" data-line-number="2">&nbsp;</td><td id="LC2" class="blob-code blob-code-inner js-file-line"><span class="pl-k">if</span> (<span class="pl-c1">1</span> <span class="pl-k">&gt;</span> <span class="pl-c1">0</span>) {</td></tr><tr><td id="L3" class="blob-num js-line-number" data-line-number="3">&nbsp;</td><td id="LC3" class="blob-code blob-code-inner js-file-line"><span class="pl-en">console</span>.<span class="pl-c1">log</span>(<span class="pl-s"><span class="pl-pds">\'</span>condition is true<span class="pl-pds">\'</span></span>);</td></tr><tr><td id="L4" class="blob-num js-line-number" data-line-number="4">&nbsp;</td><td id="LC4" class="blob-code blob-code-inner js-file-line">}</td></tr></tbody></table>';
                },
            },
        } as unknown as ClipboardEvent;

        const codeBlockMarkdown = "test\n```\n// a javascript codeblock example\nif (1 > 0) {\n  return 'condition is true';\n}\n```";

        (wrapper.instance() as CreateCommentClass).pasteHandler(event);
        expect(wrapper.state<State['draft']>('draft')!.message).toBe(codeBlockMarkdown);
    });

    test('should show preview and edit mode, and return focus on preview disable', () => {
        const wrapper = shallowWithIntl(
            <CreateComment {...baseProps}/>,
        );
        const instance = wrapper.instance() as CreateCommentClass;
        instance.focusTextbox = jest.fn();
        expect(instance.focusTextbox).not.toBeCalled();

        instance.setShowPreview(true);

        expect(baseProps.setShowPreview).toHaveBeenCalledWith(true);
        expect(instance.focusTextbox).not.toBeCalled();

        wrapper.setProps({shouldShowPreview: true});
        expect(instance.focusTextbox).not.toBeCalled();
        wrapper.setProps({shouldShowPreview: false});
        expect(instance.focusTextbox).toBeCalled();
    });

    testComponentForLineBreak((value: string) => (
        <CreateComment
            {...baseProps}
            draft={{
                ...baseProps.draft,
                message: value,
            }}
            ctrlSend={true}
        />
    ), (instance: ShallowWrapper<Props, State, CreateCommentClass>) => instance.state().draft?.message);

    testComponentForMarkdownHotkeys(
        (value: string) => (
            <CreateComment
                {...baseProps}
                draft={{
                    ...baseProps.draft,
                    message: value,
                }}
                ctrlSend={true}
            />
        ),
        (wrapper: ShallowWrapper, setSelectionRangeFn: jest.Mock) => {
            const mockTop = () => {
                return document.createElement('div');
            };
            (wrapper.instance() as CreateCommentClass)['textboxRef'] = {
                current: {
                    getInputBox: jest.fn(() => {
                        return {
                            focus: jest.fn(),
                            getBoundingClientRect: jest.fn(mockTop),
                            setSelectionRange: setSelectionRangeFn,
                        };
                    }),
                } as unknown as TextboxClass,
            };
        },
        (instance: ShallowWrapper<Props, State, CreateCommentClass>) => instance.find(Textbox),
        (instance: ShallowWrapper<Props, State, CreateCommentClass>) => instance.state().draft?.message,
    );

    it('should adjust selection to correct text', () => {
        const value = 'Jalebi _Fafda_ and Sambharo';
        const wrapper = shallowWithIntl(
            <CreateComment
                {...baseProps}
                draft={{
                    ...baseProps.draft,
                    message: value,
                }}
                ctrlSend={true}
            />,
        );

        const setSelectionRangeFn = jest.fn();
        const mockTop = () => {
            return document.createElement('div');
        };
        (wrapper.instance() as CreateCommentClass)['textboxRef'] = {
            current: {
                getInputBox: jest.fn(() => {
                    return {
                        focus: jest.fn(),
                        getBoundingClientRect: jest.fn(mockTop),
                        setSelectionRange: setSelectionRangeFn,
                    };
                }),
            } as unknown as TextboxClass,
        };

        const textbox = wrapper.find(Textbox);
        const e = makeSelectionEvent(value, 7, 14) as React.SyntheticEvent<TextboxElement, Event>;
        textbox.props().onSelect!(e);
        expect(setSelectionRangeFn).toHaveBeenCalledWith(8, 13);
    });

    it('should blur when ESCAPE is pressed', () => {
        const wrapper = shallowWithIntl(
            <CreateComment
                {...baseProps}
            />,
        );
        const instance = wrapper.instance() as CreateCommentClass;
        const blur = jest.fn();

        const mockImpl = () => {
            return {
                blur: jest.fn(),
                focus: jest.fn(),
            };
        };

        instance['textboxRef'] = {
            current: {
                getInputBox: jest.fn(mockImpl),
                blur,
            } as unknown as TextboxClass,
        };

        const mockTarget = {
            selectionStart: 0,
            selectionEnd: 0,
            value: 'brown\nfox jumps over lazy dog',
        };

        const commentEscapeKey = {
            preventDefault: jest.fn(),
            ctrlKey: true,
            key: Constants.KeyCodes.ESCAPE[0],
            keyCode: Constants.KeyCodes.ESCAPE[1],
            target: mockTarget,
        } as unknown as React.KeyboardEvent<TextboxElement>;

        instance.handleKeyDown(commentEscapeKey);
        expect(blur).toHaveBeenCalledTimes(1);
    });
});