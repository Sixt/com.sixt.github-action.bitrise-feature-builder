"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const axios_1 = __importDefault(require("axios"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Parse inputs from workflow yaml file
            const githubToken = core.getInput("github-token", { required: true });
            const bitriseToken = core.getInput("bitrise-token", { required: true });
            const bitriseSlug = core.getInput("bitrise-slug", { required: true });
            const triggerPhrase = core.getInput("trigger-phrase", { required: true });
            const bitriseWorkflow = core.getInput("bitrise-workflow", { required: true });
            if (github.context.eventName !== "issue_comment") {
                core.setFailed("Action should only be executed on the issue_comment event.");
                return;
            }
            const issueCommentPayload = github.context.payload;
            if (!issueCommentPayload.comment.body.startsWith(triggerPhrase)) {
                core.warning(`Issue comment does not start with trigger phrase '${triggerPhrase}'`);
                return;
            }
            const issueNumber = issueCommentPayload.issue.number;
            const octokit = new github.GitHub(githubToken);
            const pullRequest = yield octokit.pulls.get(Object.assign(Object.assign({}, github.context.repo), { pull_number: issueNumber }));
            if (pullRequest.status !== 200) {
                core.warning(`Could not get pull request with number ${issueNumber}`);
                return;
            }
            const comment = issueCommentPayload.comment.body;
            const changelog = `${comment.slice(triggerPhrase.length + 1)}\n${pullRequest.data.title}`;
            const body = {
                hook_info: {
                    type: "bitrise",
                },
                build_params: {
                    branch: `${pullRequest.data.head.ref}`,
                    commit_hash: `${pullRequest.data.head.sha}`,
                    workflow_id: bitriseWorkflow,
                    environments: [
                        {
                            mapped_to: "CHANGELOG",
                            value: changelog,
                        },
                    ],
                },
            };
            const triggerBuildUrl = `https://api.bitrise.io/v0.1/apps/${bitriseSlug}/builds`;
            const bitriseResponse = yield axios_1.default.post(triggerBuildUrl, body, {
                headers: {
                    Authorization: bitriseToken,
                },
            });
            if (bitriseResponse.status !== 201) {
                core.setFailed(`Action failed to trigger build on Bitrise with error ${bitriseResponse.statusText}`);
                return;
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
run();
