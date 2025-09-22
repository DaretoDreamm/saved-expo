import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NewsArticle, RootStackParamList } from '../../types';
import { newsService, formatTimeAgo } from '../../services/newsService';

type NewsArticleDetailRouteProp = RouteProp<RootStackParamList, 'NewsArticleDetail'>;

const screenWidth = Dimensions.get('window').width;

// Mock news articles for demonstration
const mockArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Stock Market Reaches New Highs as Technology Sector Surges',
    summary: 'Major indices close at record levels driven by strong earnings from tech giants and positive economic indicators.',
    content: `The stock market continued its upward trajectory today as major technology companies reported better-than-expected quarterly earnings. The S&P 500 and NASDAQ both reached new record highs, with investor confidence bolstered by strong consumer spending data and dovish comments from Federal Reserve officials.

Apple Inc. (AAPL) led the charge with a 5.2% gain after reporting revenue growth of 8% year-over-year, driven by strong iPhone sales and growth in their services segment. The company's CEO highlighted the growing adoption of their latest AI features and the expansion into emerging markets.

Microsoft Corporation (MSFT) also posted impressive results, with cloud revenue growing 22% as enterprise customers continue their digital transformation initiatives. The company's Azure platform gained market share against competitors, strengthening Microsoft's position in the cloud computing space.

Federal Reserve Chairman Jerome Powell's recent comments suggesting a measured approach to future rate changes have provided additional support to equity markets. Powell emphasized the Fed's commitment to data-dependent policy decisions while acknowledging the progress made in bringing inflation toward the 2% target.

Market analysts are cautiously optimistic about the remainder of the year, citing strong corporate earnings, resilient consumer spending, and a more predictable monetary policy environment. However, they caution investors to remain vigilant about potential headwinds including geopolitical tensions and global supply chain considerations.

The technology sector's outperformance comes amid growing investor enthusiasm for artificial intelligence and cloud computing technologies. Companies that have successfully integrated AI into their business models are seeing premium valuations as investors bet on the long-term growth potential of these technologies.

Looking ahead, investors will be closely watching upcoming economic data releases, including employment figures and inflation reports, which could influence Federal Reserve policy decisions in the coming months.`,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    source: 'Financial Times',
    url: 'https://example.com/news/1',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    relatedSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
  },
  {
    id: '2',
    title: 'Federal Reserve Signals Potential Rate Cut in Coming Months',
    summary: 'Central bank officials hint at monetary policy easing as inflation shows signs of cooling.',
    content: `Federal Reserve Chairman Jerome Powell indicated that the central bank is prepared to adjust monetary policy in response to changing economic conditions. Recent inflation data has shown a marked decline from peak levels, giving the Fed more flexibility in its approach to interest rates.

The Consumer Price Index (CPI) for the latest month came in at 3.2% year-over-year, down from the previous month's 3.7% reading and significantly below the peak of over 9% reached in mid-2022. This continued moderation in price pressures has prompted Fed officials to consider a more accommodative stance.

Powell emphasized that any policy changes would be data-dependent and measured, noting the importance of ensuring that inflation continues on its downward trajectory toward the Fed's 2% target. "We are seeing encouraging signs in the inflation data, but we want to be confident that this trend is sustainable," Powell stated during a recent press conference.

Financial markets have responded positively to the possibility of rate cuts, with bond yields declining and equity markets rallying. The prospect of lower borrowing costs has particularly benefited interest-sensitive sectors such as real estate and utilities.

Economic indicators beyond inflation are also supporting the case for potential policy easing. While the labor market remains strong with unemployment near historic lows, there are signs of moderation in job growth and wage increases. Consumer spending has shown resilience but at a more moderate pace than earlier in the year.

The Federal Reserve's dual mandate focuses on both price stability and full employment. With inflation trending lower and employment remaining solid, policymakers have more room to consider adjustments that could support continued economic growth.

Market participants are now pricing in a higher probability of rate cuts in the coming quarters, with futures markets suggesting potential reductions beginning in the next few months. However, Fed officials have stressed that any policy changes will depend on incoming economic data and the continued progress on inflation.`,
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    relatedSymbols: ['SPY', 'TLT', 'GLD'],
  },
];

const NewsArticleDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<NewsArticleDetailRouteProp>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from the news service or API
      const foundArticle = mockArticles.find(a => a.id === articleId);
      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        Alert.alert('Error', 'Article not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load article');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await Share.share({
        message: `${article.title}\n\n${article.summary}\n\nRead more: ${article.url || 'Saved App'}`,
        title: article.title,
        url: article.url,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const handleOpenUrl = async () => {
    if (!article?.url) return;

    try {
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const handleSymbolPress = (symbol: string) => {
    Alert.alert(
      'View Asset',
      `Would you like to view details for ${symbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View',
          onPress: () => {
            // In a real app, this would navigate to AssetDetailScreen
            navigation.navigate('AssetDetail' as any, { assetId: symbol });
          },
        },
      ]
    );
  };

  const adjustFontSize = (increment: number) => {
    const newSize = fontSize + increment;
    if (newSize >= 12 && newSize <= 24) {
      setFontSize(newSize);
    }
  };

  if (isLoading || !article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Article</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {article.source}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => adjustFontSize(-1)} style={styles.headerButton}>
            <Ionicons name="remove" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => adjustFontSize(1)} style={styles.headerButton}>
            <Ionicons name="add" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Article Image */}
        {article.imageUrl && (
          <Image 
            source={{ uri: article.imageUrl }} 
            style={styles.articleImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.articleContent}>
          {/* Article Title */}
          <Text style={[styles.articleTitle, { fontSize: fontSize + 4 }]}>
            {article.title}
          </Text>

          {/* Article Meta */}
          <View style={styles.articleMeta}>
            <View style={styles.metaRow}>
              <View style={styles.sourceInfo}>
                <Ionicons name="newspaper-outline" size={16} color="#6b7280" />
                <Text style={styles.sourceText}>{article.source}</Text>
              </View>
              <Text style={styles.timeText}>
                {formatTimeAgo(article.publishedAt)}
              </Text>
            </View>

            {article.relatedSymbols && article.relatedSymbols.length > 0 && (
              <View style={styles.symbolsContainer}>
                <Text style={styles.symbolsLabel}>Related Assets:</Text>
                <View style={styles.symbolsList}>
                  {article.relatedSymbols.map((symbol) => (
                    <TouchableOpacity
                      key={symbol}
                      style={styles.symbolTag}
                      onPress={() => handleSymbolPress(symbol)}
                    >
                      <Text style={styles.symbolText}>{symbol}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Article Summary */}
          <View style={styles.summaryContainer}>
            <Text style={[styles.articleSummary, { fontSize: fontSize + 1 }]}>
              {article.summary}
            </Text>
          </View>

          {/* Article Content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.articleContentText, { fontSize }]}>
              {article.content}
            </Text>
          </View>

          {/* Article Actions */}
          <View style={styles.actionsContainer}>
            {article.url && (
              <TouchableOpacity style={styles.actionButton} onPress={handleOpenUrl}>
                <Ionicons name="open-outline" size={20} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Read Full Article</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Share Article</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Published on {new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  articleImage: {
    width: screenWidth,
    height: 220,
    backgroundColor: '#f3f4f6',
  },
  articleContent: {
    padding: 20,
  },
  articleTitle: {
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 28,
    marginBottom: 16,
  },
  articleMeta: {
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  symbolsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  symbolsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  symbolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  symbolTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  symbolText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  summaryContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  articleSummary: {
    fontWeight: '500',
    color: '#374151',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  contentContainer: {
    marginBottom: 32,
  },
  articleContentText: {
    color: '#374151',
    lineHeight: 24,
    textAlign: 'justify',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 6,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default NewsArticleDetailScreen;