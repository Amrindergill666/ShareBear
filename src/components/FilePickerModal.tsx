import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image as RNImage,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme';
import DocumentPicker from 'react-native-document-picker';
import {
  requestMediaPermissions,
  fetchDeviceMediaFiles,
  RealMediaFile,
} from '../native/MediaModule';
import {
  Menu,
  X,
  Search,
  Check,
  Folder,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Music as MusicIcon,
  FolderPlus,
  RefreshCw,
  Lock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface SelectableFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  uri?: string;
  type: 'photo' | 'video' | 'doc' | 'music';
}

interface FilePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (files: { id: string; name: string; size: number; mime: string; uri?: string }[]) => void;
  targetDeviceName?: string;
}

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 40 - 12) / 2;

export function FilePickerModal({
  visible,
  onClose,
  onSend,
  targetDeviceName,
}: FilePickerModalProps) {
  const { colors } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<'photo' | 'video' | 'doc' | 'music'>('photo');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [realFiles, setRealFiles] = useState<SelectableFile[]>([]);
  const [customFiles, setCustomFiles] = useState<SelectableFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const categories = [
    { key: 'photo', label: 'Photos' },
    { key: 'video', label: 'Videos' },
    { key: 'doc', label: 'Documents' },
    { key: 'music', label: 'Music' },
  ];

  // Load real files from device on mount or category change
  const loadCategoryFiles = useCallback(async (cat: 'photo' | 'video' | 'doc' | 'music') => {
    setLoading(true);
    setPermissionDenied(false);

    try {
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      const files = await fetchDeviceMediaFiles(cat, 80);
      setRealFiles(files);
    } catch (err) {
      console.error('[FilePickerModal] Error loading files:', err);
      setRealFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSelectedIds({}); // Fresh selection session with nothing pre-selected
      loadCategoryFiles(activeCategory);
    }
  }, [visible, activeCategory, loadCategoryFiles]);

  const allFiles = useMemo(() => {
    // Merge custom picked files that match current category + real device files
    const matchingCustom = customFiles.filter((f) => f.type === activeCategory);
    return [...matchingCustom, ...realFiles];
  }, [customFiles, realFiles, activeCategory]);

  const filteredFiles = useMemo(() => {
    return allFiles.filter((item) => {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [allFiles, searchQuery]);

  const allSelectedFilesList = useMemo(() => {
    const combined = [...customFiles, ...realFiles];
    const uniqueMap = new Map<string, SelectableFile>();
    combined.forEach((f) => uniqueMap.set(f.id, f));
    return Array.from(uniqueMap.values()).filter((item) => selectedIds[item.id]);
  }, [customFiles, realFiles, selectedIds]);

  const totalBytesSelected = useMemo(() => {
    return allSelectedFilesList.reduce((acc, curr) => acc + (curr.size || 0), 0);
  }, [allSelectedFilesList]);

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = filteredFiles.length > 0 && filteredFiles.every((f) => selectedIds[f.id]);
    const updated = { ...selectedIds };
    filteredFiles.forEach((f) => {
      updated[f.id] = !allSelected;
    });
    setSelectedIds(updated);
  };

  const handleBrowseSystemStorage = async () => {
    try {
      const result = await DocumentPicker.pick({
        allowMultiSelection: true,
        type: [DocumentPicker.types.allFiles],
      });

      if (result && result.length > 0) {
        const newItems: SelectableFile[] = result.map((f, idx) => {
          const mime = f.type || 'application/octet-stream';
          let type: 'photo' | 'video' | 'doc' | 'music' = 'doc';
          if (mime.startsWith('image/')) type = 'photo';
          else if (mime.startsWith('video/')) type = 'video';
          else if (mime.startsWith('audio/')) type = 'music';

          const newId = `custom-${Date.now()}-${idx}`;
          return {
            id: newId,
            name: f.name || 'unnamed_file',
            size: f.size || 0,
            mime,
            uri: f.uri,
            type,
          };
        });

        setCustomFiles((prev) => [...newItems, ...prev]);

        // Auto-select picked files
        const updatedSelected = { ...selectedIds };
        newItems.forEach((item) => {
          updatedSelected[item.id] = true;
        });
        setSelectedIds(updatedSelected);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('[FilePickerModal] Pick error:', err);
      }
    }
  };

  const handleSend = () => {
    if (allSelectedFilesList.length === 0) return;
    const payload = allSelectedFilesList.map((f, idx) => ({
      id: `${f.id}-${Date.now()}-${idx}`,
      name: f.name,
      size: f.size,
      mime: f.mime,
      uri: f.uri,
      type: f.type,
    }));
    onSend(payload);
    onClose();
  };

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'photo':
        return 'Device Photos';
      case 'video':
        return 'Device Videos';
      case 'doc':
        return 'Device Documents';
      case 'music':
        return 'Device Audio';
      default:
        return 'Device Files';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background,paddingTop:safeAreaInsets.top+10 }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose} activeOpacity={0.7}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Select Files</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBrowseSystemStorage}
            activeOpacity={0.7}
          >
            <FolderPlus size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchPill,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search files..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Category Pills */}
        <View style={styles.categoryRowWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isActive ? colors.primaryContainer : colors.cardBg,
                      borderColor: isActive ? `${colors.primary}55` : colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setActiveCategory(cat.key as any)}
                >
                  {isActive && (
                    <Check size={14} color={colors.primary} style={{ marginRight: 6 }} strokeWidth={2.5} />
                  )}
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: isActive ? colors.primary : colors.textSecondary,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Heading & Select All */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            {getCategoryTitle()} ({filteredFiles.length})
          </Text>
          <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
            <Text style={[styles.selectAllText, { color: colors.secondary }]}>
              {filteredFiles.length > 0 && filteredFiles.every((f) => selectedIds[f.id])
                ? 'Deselect all'
                : 'Select all'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Media / Files Grid */}
        <ScrollView
          style={styles.gridScrollView}
          contentContainerStyle={styles.gridScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerStatusContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                Loading {activeCategory}s from device...
              </Text>
            </View>
          ) : permissionDenied ? (
            <View style={styles.centerStatusContainer}>
              <Lock size={44} color={colors.primary} style={{ marginBottom: 12 }} />
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Permission Required</Text>
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                Please allow storage access to view and share your device's photos and files.
              </Text>
              <TouchableOpacity
                style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => loadCategoryFiles(activeCategory)}
              >
                <RefreshCw size={16} color={colors.onPrimary} style={{ marginRight: 8 }} />
                <Text style={[styles.permissionBtnText, { color: colors.onPrimary }]}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : filteredFiles.length === 0 ? (
            <View style={styles.centerStatusContainer}>
              <Folder size={44} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
                No {activeCategory}s found
              </Text>
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                No matching files found on this device or search filter.
              </Text>
              <TouchableOpacity
                style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={handleBrowseSystemStorage}
              >
                <FolderPlus size={16} color={colors.onPrimary} style={{ marginRight: 8 }} />
                <Text style={[styles.permissionBtnText, { color: colors.onPrimary }]}>Browse Storage</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {filteredFiles.map((file) => {
                const isSelected = !!selectedIds[file.id];
                const hasImageUri = (file.type === 'photo' || file.type === 'video') && !!file.uri;

                return (
                  <TouchableOpacity
                    key={file.id}
                    style={[
                      styles.gridCard,
                      {
                        width: GRID_ITEM_WIDTH,
                        backgroundColor: colors.surfaceElevated,
                        borderColor: isSelected ? colors.primary : colors.cardBorder,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => toggleSelect(file.id)}
                  >
                    {/* Selection Checkbox in Top Right */}
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected ? colors.primary : 'rgba(0, 0, 0, 0.45)',
                          borderColor: isSelected ? colors.primary : 'rgba(255, 255, 255, 0.65)',
                        },
                      ]}
                    >
                      {isSelected && <Check size={13} color={colors.onPrimary} strokeWidth={3} />}
                    </View>

                    {/* Real Image / Thumbnail Preview */}
                    {hasImageUri ? (
                      <RNImage
                        source={{ uri: file.uri }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        {file.type === 'photo' && <ImageIcon size={36} color={colors.primary} />}
                        {file.type === 'video' && <VideoIcon size={36} color={colors.primary} />}
                        {file.type === 'doc' && <FileText size={36} color={colors.primary} />}
                        {file.type === 'music' && <MusicIcon size={36} color={colors.primary} />}
                      </View>
                    )}

                    {/* Bottom Meta Info Bar */}
                    <View style={[styles.cardMetaBar, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}>
                      <Text style={styles.cardFileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.cardFileSize}>{formatSize(file.size)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* "Browse Storage" Card */}
              <TouchableOpacity
                style={[
                  styles.gridCard,
                  styles.browseMoreCard,
                  {
                    width: GRID_ITEM_WIDTH,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.cardBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={handleBrowseSystemStorage}
              >
                <FolderPlus size={32} color={colors.primary} />
                <Text style={[styles.browseMoreText, { color: colors.primary }]}>Browse Storage</Text>
                <Text style={[styles.browseMoreSub, { color: colors.textSecondary }]}>Pick any file</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Floating Selection & Send Action Bar */}
        {allSelectedFilesList.length > 0 && (
          <View style={styles.bottomBarContainer} pointerEvents="box-none">
            <View
              style={[
                styles.bottomFloatingBar,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {/* Left File Badge & Counter */}
              <View style={styles.bottomBarLeft}>
                <View style={[styles.folderBadgeCircle, { backgroundColor: colors.surfaceElevated }]}>
                  <Folder size={22} color={colors.primary} />
                  <View style={[styles.badgeCount, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.badgeCountText}>{allSelectedFilesList.length}</Text>
                  </View>
                </View>
                <View style={styles.selectionInfo}>
                  <Text style={[styles.selectionCountText, { color: colors.textPrimary }]}>
                    {allSelectedFilesList.length} {allSelectedFilesList.length === 1 ? 'file' : 'files'}
                  </Text>
                  <Text style={[styles.selectionSizeText, { color: colors.textSecondary }]}>
                    {formatSize(totalBytesSelected)}
                  </Text>
                </View>
              </View>

              {/* Right Send Action Button */}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleSend}
              >
                <Text style={[styles.sendButtonText, { color: colors.onPrimary }]}>Send</Text>
                <Send size={15} color={colors.onPrimary} style={{ marginLeft: 6 }} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 12 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  categoryRowWrapper: {
    marginBottom: 16,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 13.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridScrollView: {
    flex: 1,
  },
  gridScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    height: 170,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  checkbox: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 16,
  },
  cardMetaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'column',
  },
  cardFileName: {
    color: '#F8FAFC',
    fontSize: 11.5,
    fontWeight: '600',
  },
  cardFileSize: {
    color: '#CBD5E1',
    fontSize: 10,
    marginTop: 2,
  },
  browseMoreCard: {
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  browseMoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  browseMoreSub: {
    fontSize: 11,
    marginTop: 2
  },
  centerStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 18,
  },
  permissionBtnText: {
    fontSize: 14.5,
    fontWeight: 'bold',
 },
bottomBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  bottomFloatingBar: {
    width: '90%',
    height: 68,
    borderRadius: 34,
    borderWidth: 1.2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 12,
  },
  badgeCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectionInfo: {
    justifyContent: 'center',
  },
  selectionCountText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  selectionSizeText: {
    fontSize: 12,
    marginTop: 2,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: 14.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
});
