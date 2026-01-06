/**
 * API client for communicating with the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiError {
  detail: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: 'An unexpected error occurred',
      }));
      throw new Error(error.detail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async signup(email: string, password: string) {
    return this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request<User>('/api/auth/me');
  }

  // Level endpoints
  async getLevels() {
    return this.request<LevelListItem[]>('/api/levels');
  }

  async getLevel(slug: string) {
    return this.request<Level>(`/api/levels/${slug}`);
  }

  async getLevelById(id: number) {
    return this.request<Level>(`/api/levels/by-id/${id}`);
  }

  // Progress endpoints
  async getProgress() {
    return this.request<UserProgressSummary[]>('/api/progress');
  }

  async getLevelProgress(levelId: number) {
    return this.request<Progress | null>(`/api/progress/${levelId}`);
  }

  async incrementAttempts(levelId: number) {
    return this.request<Progress>('/api/progress/attempt', {
      method: 'POST',
      body: JSON.stringify({ level_id: levelId }),
    });
  }

  async submitCompletion(levelId: number, runData: RunData) {
    return this.request<SubmitCompletionResponse>('/api/progress/complete', {
      method: 'POST',
      body: JSON.stringify({ level_id: levelId, run_data: runData }),
    });
  }

  // Admin endpoints
  async createLevel(data: CreateLevelData) {
    return this.request<Level>('/api/levels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLevel(slug: string, data: UpdateLevelData) {
    return this.request<Level>(`/api/levels/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLevel(slug: string) {
    return this.request<void>(`/api/levels/${slug}`, {
      method: 'DELETE',
    });
  }

  // World endpoints
  async getWorldState() {
    return this.request<WorldStateResponse>('/api/world/state');
  }

  async getZone(zoneSlug: string) {
    return this.request<ZoneResponse>(`/api/world/zones/${zoneSlug}`);
  }

  async movePlayer(x: number, y: number) {
    return this.request<{ success: boolean; message: string; x: number; y: number }>(
      '/api/world/move',
      { method: 'POST', body: JSON.stringify({ x, y }) }
    );
  }

  async transitionZone(targetZoneSlug: string) {
    return this.request<{ success: boolean; message: string; zone_slug: string; position: Position }>(
      '/api/world/transition',
      { method: 'POST', body: JSON.stringify({ target_zone_slug: targetZoneSlug }) }
    );
  }

  async respawnPlayer() {
    return this.request<{ success: boolean; message: string; gold_lost: number; position: Position }>(
      '/api/world/respawn',
      { method: 'POST' }
    );
  }

  // Combat endpoints
  async startCombat(enemySpawnId: number) {
    return this.request<CombatStartResponse>('/api/combat/start', {
      method: 'POST',
      body: JSON.stringify({ enemy_spawn_id: enemySpawnId }),
    });
  }

  async combatAction(action: string, itemId?: string) {
    return this.request<CombatActionResponse>('/api/combat/action', {
      method: 'POST',
      body: JSON.stringify({ action, item_id: itemId }),
    });
  }

  // Inventory endpoints
  async getInventory() {
    return this.request<InventoryResponse>('/api/inventory');
  }

  async useItem(itemId: string) {
    return this.request<UseItemResponse>('/api/inventory/use', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    });
  }

  async equipItem(itemId: string) {
    return this.request<EquipItemResponse>('/api/inventory/equip', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    });
  }

  async unequipItem(slot: string) {
    return this.request<{ success: boolean; message: string }>('/api/inventory/unequip', {
      method: 'POST',
      body: JSON.stringify({ slot }),
    });
  }

  // NPC endpoints
  async getNPC(npcId: string) {
    return this.request<NPCInfo>(`/api/npcs/${npcId}`);
  }

  async getDialogue(npcId: string) {
    return this.request<DialogueResponse>(`/api/npcs/${npcId}/dialogue`);
  }

  async respondToDialogue(npcId: string, optionIndex: number) {
    return this.request<DialogueSelectResponse>(`/api/npcs/${npcId}/dialogue/respond`, {
      method: 'POST',
      body: JSON.stringify({ option_index: optionIndex }),
    });
  }

  async getShop(npcId: string) {
    return this.request<ShopInventoryResponse>(`/api/npcs/${npcId}/shop`);
  }

  async buyItem(npcId: string, itemId: string, quantity: number) {
    return this.request<BuyItemResponse>(`/api/npcs/${npcId}/shop/buy`, {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity }),
    });
  }

  async sellItem(npcId: string, itemId: string, quantity: number) {
    return this.request<SellItemResponse>(`/api/npcs/${npcId}/shop/sell`, {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity }),
    });
  }

  // Chest endpoints
  async getChest(chestId: string) {
    return this.request<ChestInfo>(`/api/chests/${chestId}`);
  }

  async openChest(chestId: string) {
    return this.request<OpenChestResponse>('/api/chests/open', {
      method: 'POST',
      body: JSON.stringify({ chest_id: chestId }),
    });
  }

  // Progression endpoints
  async getProgression() {
    return this.request<PlayerProgression>('/api/progression/me');
  }

  // Character endpoints
  async getCharacters() {
    return this.request<Character[]>('/api/characters');
  }

  async selectCharacter(characterId: number) {
    return this.request<{ success: boolean; selected_character_id: number }>(
      '/api/characters/select',
      {
        method: 'POST',
        body: JSON.stringify({ character_id: characterId }),
      }
    );
  }

  async purchaseCharacter(characterId: number) {
    return this.request<{ success: boolean; remaining_coins: number }>(
      '/api/characters/purchase',
      {
        method: 'POST',
        body: JSON.stringify({ character_id: characterId }),
      }
    );
  }

  // Dev endpoints
  async resetProgress() {
    return this.request<{ success: boolean; message: string }>(
      '/api/dev/reset-progress',
      { method: 'POST' }
    );
  }
}

// World Types
export interface Position {
  x: number;
  y: number;
}

export interface NearbyEntity {
  id: string;
  name: string;
  entity_type: 'enemy' | 'npc' | 'chest' | 'item';
  position: Position;
  distance: number;
}

export interface PlayerWorldState {
  zone_id: number;
  zone_slug: string;
  zone_name: string;
  position: Position;
  hp: number;
  max_hp: number;
  mp: number;
  max_mp: number;
  level: number;
  xp: number;
  xp_to_next: number;
  gold: number;
  attack: number;
  defense: number;
}

export interface ZoneConnection {
  target_slug: string;
  x: number;
  y: number;
  required_level: number;
}

export interface ZoneResponse {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  terrain_data: Record<string, unknown> | null;
  spawn_x: number;
  spawn_y: number;
  level_requirement: number;
  enemy_level_min: number;
  enemy_level_max: number;
  connections: ZoneConnection[];
}

export interface WorldStateResponse {
  player: PlayerWorldState;
  zone: ZoneResponse;
  nearby_enemies: NearbyEntity[];
  nearby_npcs: NearbyEntity[];
  nearby_chests: NearbyEntity[];
  nearby_items: NearbyEntity[];
}

// Combat Types
export interface EnemyStats {
  id: string;
  name: string;
  enemy_type: string;
  hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  level: number;
  xp_reward: number;
  coin_reward: number;
}

export interface DamageInfo {
  amount: number;
  is_critical: boolean;
  was_blocked: boolean;
  blocked_amount: number;
}

export interface LootItem {
  item_id: string;
  name: string;
  quantity: number;
  rarity: string;
}

export interface CombatStartResponse {
  success: boolean;
  message: string;
  enemy: EnemyStats;
  player_hp: number;
  player_max_hp: number;
}

export interface CombatActionResponse {
  success: boolean;
  message: string;
  player_action_result: string;
  enemy_action_result: string;
  player_damage: DamageInfo | null;
  enemy_damage: DamageInfo | null;
  player_hp: number;
  enemy_hp: number;
  combat_ended: boolean;
  victory: boolean;
  fled: boolean;
  xp_gained: number;
  gold_gained: number;
  loot: LootItem[];
  level_up: boolean;
  new_level: number | null;
}

// Inventory Types
export interface ItemInfo {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  rarity: string;
  quantity: number;
  is_equipped: boolean;
  equip_slot: string | null;
  attack_bonus: number;
  defense_bonus: number;
  hp_bonus: number;
  effect_type: string | null;
  effect_value: number;
  buy_price: number;
  sell_price: number;
  sprite_key: string | null;
}

export interface EquippedItems {
  weapon: ItemInfo | null;
  head: ItemInfo | null;
  chest: ItemInfo | null;
  legs: ItemInfo | null;
  feet: ItemInfo | null;
  accessory: ItemInfo | null;
}

export interface InventoryResponse {
  items: ItemInfo[];
  equipped: EquippedItems;
  gold: number;
  max_slots: number;
  used_slots: number;
}

export interface UseItemResponse {
  success: boolean;
  message: string;
  hp_restored: number;
  mp_restored: number;
  effect_applied: string | null;
  item_consumed: boolean;
  remaining_quantity: number;
}

export interface EquipItemResponse {
  success: boolean;
  message: string;
  slot: string;
  previous_item: ItemInfo | null;
  new_stats: { attack: number; defense: number };
}

// NPC Types
export interface NPCInfo {
  id: string;
  name: string;
  display_name: string;
  npc_type: string;
  position_x: number;
  position_y: number;
  is_shopkeeper: boolean;
  sprite_key: string | null;
}

export interface DialogueOption {
  text: string;
  next_node: string | null;
  action_type: string | null;
}

export interface DialogueNode {
  text: string;
  options: DialogueOption[];
}

export interface DialogueResponse {
  npc: NPCInfo;
  current_node: DialogueNode;
  dialogue_history: string[];
}

export interface DialogueSelectResponse {
  success: boolean;
  message: string;
  next_node: DialogueNode | null;
  conversation_ended: boolean;
  action_triggered: string | null;
  shop_opened: boolean;
}

export interface ShopItem {
  item_id: string;
  name: string;
  description: string | null;
  item_type: string;
  rarity: string;
  price: number;
  stock: number;
  attack_bonus: number;
  defense_bonus: number;
  effect_type: string | null;
  effect_value: number;
  sprite_key: string | null;
}

export interface ShopInventoryResponse {
  npc_id: string;
  npc_name: string;
  items: ShopItem[];
  player_gold: number;
}

export interface BuyItemResponse {
  success: boolean;
  message: string;
  total_cost: number;
  remaining_gold: number;
  item_name: string;
  quantity_purchased: number;
}

export interface SellItemResponse {
  success: boolean;
  message: string;
  total_earned: number;
  new_gold: number;
  item_name: string;
  quantity_sold: number;
}

// Chest Types
export interface ChestInfo {
  id: string;
  chest_type: string;
  position_x: number;
  position_y: number;
  is_locked: boolean;
  is_opened: boolean;
  required_key: string | null;
}

export interface OpenChestResponse {
  success: boolean;
  message: string;
  gold_received: number;
  items_received: LootItem[];
  key_consumed: boolean;
  key_name: string | null;
}

export interface PlayerProgression {
  player_level: number;
  current_xp: number;
  xp_to_next_level: number;
  coins: number;
  selected_character_id: number | null;
}

export interface Character {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  sprite_key: string;
  level_required: number;
  quests_required: number[];
  coin_cost: number;
  is_unlocked: boolean;
  is_selected: boolean;
  unlock_reason: string | null;
}

export interface CompleteQuestResponse {
  success: boolean;
  stars_earned: number;
  xp_gained: number;
  coins_gained: number;
  leveled_up: boolean;
  new_level: number | null;
}

// Types
export interface User {
  id: number;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface LevelListItem {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  order_index: number;
}

export interface LevelJsonData {
  gridWidth: number;
  gridHeight: number;
  startPosition: { x: number; y: number };
  goals: Array<{ x: number; y: number }>;
  walls: Array<{ x: number; y: number }>;
  coins: Array<{ x: number; y: number }>;
  hazards: Array<{
    x: number;
    y: number;
    pattern: string;
    activeFrames: number[];
    type: string;
  }>;
  allowedMethods: string[];
  instructions: string;
  starterCode: string;
  winConditions: {
    reachGoal: boolean;
    collectAllCoins: boolean;
  };
}

export interface Level extends LevelListItem {
  json_data: LevelJsonData;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: number;
  user_id: number;
  level_id: number;
  attempts: number;
  completed_at: string | null;
  best_run_json: RunData | null;
}

export interface UserProgressSummary {
  level_id: number;
  level_slug: string;
  level_title: string;
  order_index: number;
  attempts: number;
  is_completed: boolean;
  is_unlocked: boolean;
}

export interface RunData {
  action_count: number;
  time_taken?: number;
  coins_collected?: number;
}

export interface SubmitCompletionResponse {
  success: boolean;
  message: string;
  progress: Progress;
}

export interface CreateLevelData {
  slug: string;
  title: string;
  description?: string;
  order_index: number;
  json_data: LevelJsonData;
}

export interface UpdateLevelData {
  title?: string;
  description?: string;
  order_index?: number;
  json_data?: LevelJsonData;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
