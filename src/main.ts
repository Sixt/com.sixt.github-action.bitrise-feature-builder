import * as core from "@actions/core"
import * as github from "@actions/github"
import * as Webhooks from "@octokit/webhooks"
import axios from "axios"

export async function run(): Promise<void> {
  try {
    // Parse inputs from workflow yaml file
    const githubToken = core.getInput("github-token", {required: true})
    const bitriseToken = core.getInput("bitrise-token", {required: true})
    const bitriseSlug = core.getInput("bitrise-slug", {required: true})
    const triggerPhrase = core.getInput("trigger-phrase", {required: true})
    const bitriseWorkflow = core.getInput("bitrise-workflow", {required: true})

    if (github.context.eventName !== "issue_comment") {
      core.setFailed("Action should only be executed on the issue_comment event.")
      return
    }

    const issueCommentPayload = github.context.payload as Webhooks.WebhookPayloadIssueComment
    if (!issueCommentPayload.comment.body.startsWith(triggerPhrase)) {
      core.warning(`Issue comment does not start with trigger phrase '${triggerPhrase}'`)
      return
    }

    const issueNumber = issueCommentPayload.issue.number
    const octokit = new github.GitHub(githubToken)
    const pullRequest = await octokit.pulls.get({
      ...github.context.repo,
      pull_number: issueNumber,
    })

    if (pullRequest.status !== 200) {
      core.warning(`Could not get pull request with number ${issueNumber}`)
      return
    }

    const comment = issueCommentPayload.comment.body
    const changelog = `${comment.slice(triggerPhrase.length + 1)}\n${pullRequest.data.title}`
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
    }

    const triggerBuildUrl = `https://api.bitrise.io/v0.1/apps/${bitriseSlug}/builds`
    const bitriseResponse = await axios.post(triggerBuildUrl, body, {
      headers: {
        Authorization: bitriseToken,
      },
    })

    if (bitriseResponse.status !== 201) {
      core.setFailed(`Action failed to trigger build on Bitrise with error ${bitriseResponse.statusText}`)
      return
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
