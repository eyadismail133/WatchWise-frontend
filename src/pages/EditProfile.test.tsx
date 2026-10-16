// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useParams } from "react-router";
import EditProfile, { EditProfileForm, type ProfileData, type FavoriteItem } from "./EditProfile";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mutateProfileMock = vi.fn().mockResolvedValue({});
const mutateUsernameMock = vi.fn().mockResolvedValue({});
const mutatePrivacyMock = vi.fn().mockResolvedValue({});
const mutateFeaturedMock = vi.fn().mockResolvedValue({});
const refetchProfileMock = vi.fn();
const refetchFavoritesMock = vi.fn();

vi.mock("../providers/trpcClient", () => ({
  trpc: {
    user: {
      getMyProfile: {
        useQuery: vi.fn(),
      },
      checkUsername: {
        useQuery: vi.fn(() => ({ data: { available: true } })),
      },
      updateProfile: {
        useMutation: vi.fn(() => ({
          mutateAsync: mutateProfileMock,
          isPending: false,
        })),
      },
      setUsername: {
        useMutation: vi.fn(() => ({
          mutateAsync: mutateUsernameMock,
          isPending: false,
        })),
      },
      updatePrivacy: {
        useMutation: vi.fn(() => ({
          mutateAsync: mutatePrivacyMock,
          isPending: false,
        })),
      },
      setFeaturedFavorites: {
        useMutation: vi.fn(() => ({
          mutateAsync: mutateFeaturedMock,
          isPending: false,
        })),
      },
      getFeaturedFavorites: {
        invalidate: vi.fn(),
      },
    },
    favorite: {
      list: {
        useQuery: vi.fn(),
      },
    },
    useUtils: vi.fn(() => ({
      user: {
        getMyProfile: { invalidate: vi.fn() },
        getFeaturedFavorites: { invalidate: vi.fn() },
      },
    })),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useAuth } from "../hooks/useAuth";
import { trpc } from "../providers/trpcClient";
import { toast } from "sonner";

function createMockTitle(id: number, title: string, mediaType: "movie" | "tv" = "movie") {
  return {
    id,
    title,
    type: (mediaType === "tv" ? "series" : "movie") as "movie" | "series",
    description: "Desc",
    genres: ["Drama"],
    moods: [],
    rating: 8,
    popularity_score: 50,
    hidden_gem_score: 10,
    poster_path: `/poster-${id}.jpg`,
    backdrop_path: null,
    releaseDate: "2022-01-01",
    mediaType,
    runtime: 120,
    tagline: null,
    status: null,
    numberOfSeasons: null,
    numberOfEpisodes: null,
    releaseYear: 2022,
    cast: [],
    director: null,
    castCards: [],
    directorCard: null,
    language: "en",
    country: "US",
    imdbRating: null,
    trailerKey: null,
  };
}

function createMockProfile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    id: 1,
    name: "Alice",
    bio: "Original Bio",
    username: "alice",
    image: null,
    avatar: null,
    isWatchlistPublic: true,
    isActivityPublic: true,
    email: "alice@example.com",
    createdAt: new Date(),
    _count: { followers: 5, following: 3 },
    ...overrides,
  };
}

function createMockFavorite(
  id: number,
  tmdbId: number,
  rank: number | null,
  userId = 1,
  mediaType: "movie" | "tv" = "movie"
): FavoriteItem {
  return {
    id,
    tmdbId,
    mediaType,
    userId,
    featuredRank: rank,
    createdAt: new Date(),
    title: createMockTitle(tmdbId, `Title ${tmdbId}`, mediaType),
  };
}

type AuthState = ReturnType<typeof useAuth>;
type AuthUser = NonNullable<AuthState["user"]>;
type AuthSession = NonNullable<AuthState["session"]>;

function createMockUser(id = "1", name = "Alice"): AuthUser {
  return {
    id,
    name,
    email: `${name.toLowerCase()}@example.com`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  };
}

function createMockSession(userId = "1"): AuthSession {
  return {
    id: "session-1",
    userId,
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
    token: "token-1",
  };
}

type ProfileQueryResult = ReturnType<typeof trpc.user.getMyProfile.useQuery>;
type FavoritesQueryResult = ReturnType<typeof trpc.favorite.list.useQuery>;

function DestinationWatcher() {
  const { username } = useParams();
  return <div data-testid="profile-view">Viewing {username}</div>;
}

describe("EditProfile integration & regression tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("redirects signed-out user to /login declaratively without render-time router warnings", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: null,
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/u/alice/edit"]}>
        <Routes>
          <Route path="/u/:username/edit" element={<EditProfile />} />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("login-page")).not.toBeNull();

    const allLoggedText = consoleErrorSpy.mock.calls
      .flatMap((call) => call.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))))
      .join(" ");

    expect(allLoggedText).not.toContain("Cannot update BrowserRouter while rendering");
    expect(allLoggedText).not.toContain("Cannot update a component");
  });

  it("navigates to existing profile username when username draft is cleared while editing bio, issuing no rename mutation", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: createMockUser("1", "Alice"),
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: createMockSession("1"),
    });

    const initialProfile = createMockProfile({
      name: "Alice",
      username: "alice",
      bio: "Original Bio",
    });

    render(
      <MemoryRouter initialEntries={["/u/alice/edit"]}>
        <Routes>
          <Route
            path="/u/alice/edit"
            element={<EditProfileForm profile={initialProfile} favorites={[]} />}
          />
          <Route path="/u/:username" element={<DestinationWatcher />} />
        </Routes>
      </MemoryRouter>
    );

    // Clear username input to empty string
    const usernameInput = screen.getByLabelText("Username") as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: "" } });
    expect(usernameInput.value).toBe("");

    // Edit bio
    const bioTextarea = screen.getByLabelText("Bio") as HTMLTextAreaElement;
    fireEvent.change(bioTextarea, { target: { value: "Updated Bio Text" } });
    expect(bioTextarea.value).toBe("Updated Bio Text");

    // Click save changes
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      // Must submit bio change
      expect(mutateProfileMock).toHaveBeenCalledWith({ bio: "Updated Bio Text" });
      // Must NOT submit invalid/empty rename mutation
      expect(mutateUsernameMock).not.toHaveBeenCalled();
      // Must navigate to /u/alice (using existing profile.username), not /u/
      expect(screen.getByTestId("profile-view")).not.toBeNull();
      expect(screen.getByTestId("profile-view").textContent).toBe("Viewing alice");
    });
  });

  it("resets dirty form and isolates cache across auth switch A->B with cached progression", () => {
    // 1. Initial authenticated user: User A (Alice, id: 1)
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: createMockUser("1", "Alice"),
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: createMockSession("1"),
    });

    vi.mocked(trpc.user.getMyProfile.useQuery).mockReturnValue({
      data: createMockProfile({ id: 1, name: "Alice", username: "alice", bio: "Alice Bio" }),
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: refetchProfileMock,
    } as unknown as ProfileQueryResult);

    vi.mocked(trpc.favorite.list.useQuery).mockReturnValue({
      data: [createMockFavorite(10, 101, 1, 1, "movie")],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: refetchFavoritesMock,
    } as unknown as FavoritesQueryResult);

    const { rerender } = render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // Alice's form renders
    const bioTextarea = screen.getByLabelText("Bio") as HTMLTextAreaElement;
    expect(bioTextarea.value).toBe("Alice Bio");

    // Alice types a dirty draft
    fireEvent.change(bioTextarea, { target: { value: "Alice Unsaved Bio Draft" } });
    expect(bioTextarea.value).toBe("Alice Unsaved Bio Draft");

    // 2. Auth switches to User B (Bob, id: 2)
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: createMockUser("2", "Bob"),
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: createMockSession("2"),
    });

    // Progression Step 1: Queries still hold cached Alice profile (id: 1) + Alice favorites (userId: 1)
    vi.mocked(trpc.user.getMyProfile.useQuery).mockReturnValue({
      data: createMockProfile({ id: 1, name: "Alice", username: "alice" }),
      isLoading: false,
      isFetching: true,
      isError: false,
      error: null,
      refetch: refetchProfileMock,
    } as unknown as ProfileQueryResult);

    rerender(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // Neither Alice's form nor dirty draft may display or save under Bob; loading spinner is shown
    expect(screen.queryByLabelText("Bio")).toBeNull();
    expect(screen.queryByText("Alice Unsaved Bio Draft")).toBeNull();

    // Progression Step 2: Bob's profile arrives (id: 2), but favorites in cache are still Alice's (userId: 1)
    vi.mocked(trpc.user.getMyProfile.useQuery).mockReturnValue({
      data: createMockProfile({ id: 2, name: "Bob", username: "bob", bio: "Bob Server Bio" }),
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: refetchProfileMock,
    } as unknown as ProfileQueryResult);

    rerender(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // Form must still NOT display because foreign favorites (userId: 1) are rejected
    expect(screen.queryByLabelText("Bio")).toBeNull();

    // Progression Step 3: Bob's favorites arrive (userId: 2)
    vi.mocked(trpc.favorite.list.useQuery).mockReturnValue({
      data: [createMockFavorite(20, 202, 1, 2, "tv")],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: refetchFavoritesMock,
    } as unknown as FavoritesQueryResult);

    rerender(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // Bob's form now mounts cleanly with Bob's data, zero Alice drafts
    expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Bob");
    expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).value).toBe("Bob Server Bio");
    expect(screen.queryByText("Alice Unsaved Bio Draft")).toBeNull();
  });

  it("submits empty items array when explicitly clearing ALL featured selections", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: createMockUser("1", "Alice"),
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: createMockSession("1"),
    });

    const profile = createMockProfile();
    // Two featured items: one movie (rank 1), one TV series (rank 2)
    const favorites = [
      createMockFavorite(1, 101, 1, 1, "movie"),
      createMockFavorite(2, 202, 2, 1, "tv"),
    ];

    render(
      <MemoryRouter>
        <EditProfileForm profile={profile} favorites={favorites} />
      </MemoryRouter>
    );

    // Both are currently featured; click each to toggle off and clear all
    const movieBtn = screen.getByRole("button", { name: /title 101/i });
    const tvBtn = screen.getByRole("button", { name: /title 202/i });
    fireEvent.click(movieBtn);
    fireEvent.click(tvBtn);

    // Save changes
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      // Must submit an explicit empty items array: { items: [] }
      expect(mutateFeaturedMock).toHaveBeenCalledWith({
        items: [],
      });
    });
  });

  it("preserves initial false privacy and ensures edited false survives background refetches", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: createMockUser("1", "Alice"),
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: createMockSession("1"),
    });

    // Profile initialized with false privacy
    const initialProfile = createMockProfile({
      name: "Alice",
      isWatchlistPublic: false,
      isActivityPublic: false,
    });

    const { rerender } = render(
      <MemoryRouter>
        <EditProfileForm profile={initialProfile} favorites={[]} />
      </MemoryRouter>
    );

    // Assert initial switches have aria-checked='false'
    const watchlistSwitch = screen.getByLabelText("Public watchlist");
    const activitySwitch = screen.getByLabelText("Public activity");
    expect(watchlistSwitch.getAttribute("aria-checked")).toBe("false");
    expect(activitySwitch.getAttribute("aria-checked")).toBe("false");

    // Edit only bio
    const bioTextarea = screen.getByLabelText("Bio") as HTMLTextAreaElement;
    fireEvent.change(bioTextarea, { target: { value: "New Bio" } });

    // Explicitly toggle activity privacy to true, then back to false
    fireEvent.click(activitySwitch); // true
    expect(activitySwitch.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(activitySwitch); // false draft
    expect(activitySwitch.getAttribute("aria-checked")).toBe("false");

    // Server refetch changes activity to true, watchlist to true, and name in the background
    const refreshedProfile = createMockProfile({
      name: "Alice Updated From Server",
      isWatchlistPublic: true,
      isActivityPublic: true,
    });

    rerender(
      <MemoryRouter>
        <EditProfileForm profile={refreshedProfile} favorites={[]} />
      </MemoryRouter>
    );

    // Assert actual switch states:
    // Explicitly edited false activity draft remains false despite server changing to true
    expect(screen.getByLabelText("Public activity").getAttribute("aria-checked")).toBe("false");
    // Untouched watchlist switch follows changed server value (true)
    expect(screen.getByLabelText("Public watchlist").getAttribute("aria-checked")).toBe("true");

    // Preserved bio edit and updated untouched name
    expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).value).toBe("New Bio");
    expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe(
      "Alice Updated From Server"
    );

    // Click save
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      // Bio ONLY submitted (not stale name)
      expect(mutateProfileMock).toHaveBeenCalledWith({ bio: "New Bio" });
      // Activity false ONLY submitted (not stale/untouched watchlist)
      expect(mutatePrivacyMock).toHaveBeenCalledWith({ isActivityPublic: false });
    });
  });

  it("enforces max-5 featured limit on selection and preserves precise replacement order upon save", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: createMockUser("1", "Alice"),
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: createMockSession("1"),
    });

    const profile = createMockProfile();
    // 5 initially selected featured items with movie and TV distinction, plus 1 unfeatured 6th item
    const favorites = [
      createMockFavorite(1, 101, 1, 1, "movie"),
      createMockFavorite(2, 102, 2, 1, "tv"),
      createMockFavorite(3, 103, 3, 1, "movie"),
      createMockFavorite(4, 104, 4, 1, "tv"),
      createMockFavorite(5, 105, 5, 1, "movie"),
      createMockFavorite(6, 106, null, 1, "tv"), // unfeatured 6th item
    ];

    render(
      <MemoryRouter>
        <EditProfileForm profile={profile} favorites={favorites} />
      </MemoryRouter>
    );

    // Attempt to select 6th item when 5 are already selected
    const sixthItemBtn = screen.getByRole("button", { name: /title 106/i });
    fireEvent.click(sixthItemBtn);

    expect(toast.error).toHaveBeenCalledWith("You can only feature up to 5 titles.");

    // Deselect the first item (101 movie)
    const firstItemBtn = screen.getByRole("button", { name: /title 101/i });
    fireEvent.click(firstItemBtn);

    // Now 4 items are selected (102 tv, 103 movie, 104 tv, 105 movie); selecting 106 tv should now succeed
    fireEvent.click(sixthItemBtn);

    // Click Save Changes
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateFeaturedMock).toHaveBeenCalledWith({
        items: [
          { tmdbId: 102, mediaType: "tv" },
          { tmdbId: 103, mediaType: "movie" },
          { tmdbId: 104, mediaType: "tv" },
          { tmdbId: 105, mediaType: "movie" },
          { tmdbId: 106, mediaType: "tv" },
        ],
      });
    });
  });

  it("preserves dirty mounted form across background query errors and allows successful save", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: createMockUser("1", "Alice"),
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: createMockSession("1"),
    });

    const aliceProfile = createMockProfile({ id: 1, name: "Alice", bio: "Original Bio" });
    const aliceFavorites = [createMockFavorite(1, 101, 1, 1, "movie")];

    vi.mocked(trpc.user.getMyProfile.useQuery).mockReturnValue({
      data: aliceProfile,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: refetchProfileMock,
    } as unknown as ProfileQueryResult);

    vi.mocked(trpc.favorite.list.useQuery).mockReturnValue({
      data: aliceFavorites,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: refetchFavoritesMock,
    } as unknown as FavoritesQueryResult);

    const { rerender } = render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // User types dirty edit into bio
    const bioTextarea = screen.getByLabelText("Bio") as HTMLTextAreaElement;
    fireEvent.change(bioTextarea, { target: { value: "Dirty Unsaved Bio" } });
    expect(bioTextarea.value).toBe("Dirty Unsaved Bio");

    // Background refetch errors, but cached data remains valid same-user data
    vi.mocked(trpc.user.getMyProfile.useQuery).mockReturnValue({
      data: aliceProfile,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { message: "Network timeout in background" },
      refetch: refetchProfileMock,
    } as unknown as ProfileQueryResult);

    rerender(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // Form remains mounted and preserves dirty edit
    expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).value).toBe("Dirty Unsaved Bio");

    // Save succeeds and sends the dirty edit
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateProfileMock).toHaveBeenCalledWith({ bio: "Dirty Unsaved Bio" });
    });
  });

  it("displays deliberate error card and triggers retry when queries fail without current-account data", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: createMockUser("1", "Alice"),
      refetchSession: vi.fn(),
      logout: vi.fn(),
      session: createMockSession("1"),
    });

    vi.mocked(trpc.user.getMyProfile.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { message: "Server connection refused" },
      refetch: refetchProfileMock,
    } as unknown as ProfileQueryResult);

    vi.mocked(trpc.favorite.list.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: refetchFavoritesMock,
    } as unknown as FavoritesQueryResult);

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    expect(screen.getByText("Server connection refused")).not.toBeNull();
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    expect(retryBtn).not.toBeNull();

    fireEvent.click(retryBtn);
    expect(refetchProfileMock).toHaveBeenCalled();
    expect(refetchFavoritesMock).toHaveBeenCalled();
  });
});
