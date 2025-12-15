import { Action, ActionPanel, Icon, List, getPreferenceValues, showToast, Toast, closeMainWindow, WindowManagement } from "@vicinae/api";
import { exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import React from "react";

const execAsync = promisify(exec);

interface Preferences {
  workspaceDirectory: string;
  maxDepth: string;
}

interface GitRepo {
  name: string;
  path: string;
  subtitle: string;
}

async function findGitRepos(): Promise<GitRepo[]> {
  const preferences = getPreferenceValues<Preferences>();
  const workDir = preferences.workspaceDirectory.replace("~", homedir());
  const maxDepth = parseInt(preferences.maxDepth) || 3;

  try {
    // Use find command to locate all .git directories
    const { stdout } = await execAsync(
      `find "${workDir}" -maxdepth ${maxDepth} -type d -name .git 2>/dev/null`
    );

    const gitDirs = stdout
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);

    const repos: GitRepo[] = gitDirs.map((gitDir) => {
      // Get the parent directory of .git
      const repoPath = gitDir.replace(/\/.git$/, "");
      const name = repoPath.split("/").pop() || repoPath;

      // Get relative path from work directory for subtitle
      const relativePath = repoPath.replace(workDir, "").replace(/^\//, "");

      return {
        name,
        path: repoPath,
        subtitle: relativePath || repoPath,
      };
    });

    // Sort by name
    return repos.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error finding git repos:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to find repositories",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}

async function openInVSCode(repoPath: string): Promise<void> {
  try {
    // Check if VS Code window with this workspace is already open
    const windows = await WindowManagement.getWindows();
    const vscodeWindows = windows.filter(
      (w) => w.application?.name?.toLowerCase().includes("code") ||
             w.application?.name?.toLowerCase().includes("vscode")
    );

    // Try to find if this workspace is already open by checking window titles
    // VS Code typically shows the folder name in the window title
    const folderName = repoPath.split("/").pop() || "";
    const existingWindow = vscodeWindows.find((w) =>
      w.application?.name?.toLowerCase().includes(folderName.toLowerCase())
    );

    if (existingWindow) {
      // Focus the existing window using wmctrl
      await execAsync(`wmctrl -ia ${existingWindow.id}`);
      await showToast({
        style: Toast.Style.Success,
        title: "Focused existing VS Code window",
        message: repoPath,
      });
    } else {
      // Open VS Code in a new window with the specified path
      await execAsync(`code -n "${repoPath}"`);
      await showToast({
        style: Toast.Style.Success,
        title: "Opened in VS Code",
        message: repoPath,
      });
    }

    // Close the Vicinae window after opening VS Code
    await closeMainWindow();
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open VS Code",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function copyPath(path: string): Promise<void> {
  try {
    await execAsync(`echo -n "${path}" | xclip -selection clipboard`);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied to clipboard",
      message: path,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to copy",
      message: "Make sure xclip is installed",
    });
  }
}

export default function Command() {
  const [repos, setRepos] = React.useState<GitRepo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadRepos() {
      setIsLoading(true);
      const foundRepos = await findGitRepos();
      setRepos(foundRepos);
      setIsLoading(false);
    }
    loadRepos();
  }, []);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search repositories..."
      navigationTitle="Open VS Code Workspace"
    >
      {repos.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Finder}
          title="No repositories found"
          description="No git repositories found in ~/work directory"
        />
      ) : (
        repos.map((repo) => (
          <List.Item
            key={repo.path}
            icon={Icon.Code}
            title={repo.name}
            subtitle={repo.subtitle}
            accessories={[{ text: repo.path }]}
            actions={
              <ActionPanel>
                <Action
                  title="Open in VS Code"
                  icon={Icon.Code}
                  onAction={() => openInVSCode(repo.path)}
                />
                <Action
                  title="Copy Path"
                  icon={Icon.Clipboard}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                  onAction={() => copyPath(repo.path)}
                />
                <Action
                  title="Open in Terminal"
                  icon={Icon.Terminal}
                  shortcut={{ modifiers: ["cmd"], key: "t" }}
                  onAction={async () => {
                    try {
                      await execAsync(`alacritty --working-directory "${repo.path}" &`);
                      await showToast({
                        style: Toast.Style.Success,
                        title: "Opened in terminal",
                      });
                      await closeMainWindow();
                    } catch (error) {
                      // Fallback to default terminal
                      try {
                        await execAsync(`gnome-terminal --working-directory="${repo.path}" &`);
                        await showToast({
                          style: Toast.Style.Success,
                          title: "Opened in terminal",
                        });
                        await closeMainWindow();
                      } catch {
                        await showToast({
                          style: Toast.Style.Failure,
                          title: "Failed to open terminal",
                        });
                      }
                    }
                  }}
                />
                <Action
                  title="Refresh List"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={async () => {
                    setIsLoading(true);
                    const foundRepos = await findGitRepos();
                    setRepos(foundRepos);
                    setIsLoading(false);
                  }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
